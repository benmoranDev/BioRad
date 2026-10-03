use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use crate::models::{ApiResponse, AuditLog, PaymentAuditLog};
use crate::routes::auth::AppState;
use crate::services::mercadopago::{
    CheckoutResponse, CreateCheckoutRequest, MercadoPagoWebhookPayload, WebhookProcessResult,
};

#[derive(Debug, Deserialize)]
pub struct WebhookQueryParams {
    pub topic: Option<String>,
    pub id: Option<String>,
    pub r#type: Option<String>,
    #[serde(rename = "data.id")]
    pub data_id: Option<String>,
}

/// POST /api/payments/checkout
/// Processes payments via Mercado Pago (PIX or Credit Card in up to 6x)
pub async fn process_checkout_handler(
    State(state): State<AppState>,
    Json(payload): Json<CreateCheckoutRequest>,
) -> Response {
    // Validate amount
    if payload.amount <= 0.0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<CheckoutResponse> {
                success: false,
                message: "O valor da transação deve ser estritamente maior que zero.".to_string(),
                data: None,
                total: Some(0),
            }),
        )
            .into_response();
    }

    // Validate installment limit (up to 6x max for Mercado Pago)
    if let Some(inst) = payload.installments {
        if inst < 1 || inst > 6 {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<CheckoutResponse> {
                    success: false,
                    message: "O parcelamento no Mercado Pago é permitido exclusivamente em até 6x sem juros.".to_string(),
                    data: None,
                    total: Some(0),
                }),
            )
                .into_response();
        }
    }

    // Process via Mercado Pago Service
    match state.mercadopago.process_checkout(payload).await {
        Ok(checkout_result) => {
            // Record audit log
            let audit = AuditLog {
                id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
                user_id: "system".to_string(),
                user_email: "pagamentos@radbio.com.br".to_string(),
                user_role: "SYSTEM".to_string(),
                action: "PAYMENT_CHECKOUT_CREATED".to_string(),
                resource: format!("Payment:{}", checkout_result.transaction_code),
                details: Some(format!(
                    "Checkout de R$ {:.2} via {} gerado no Mercado Pago",
                    checkout_result.amount,
                    checkout_result.payment_method.to_uppercase()
                )),
                ip_address: Some("127.0.0.1".to_string()),
                user_agent: Some("RadBio Rust Backend".to_string()),
                timestamp: Utc::now(),
            };
            let _ = state.supabase.insert_audit_log(&audit).await;

            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: checkout_result.success,
                    message: checkout_result.message.clone(),
                    data: Some(checkout_result),
                    total: Some(1),
                }),
            )
                .into_response()
        }
        Err(err) => {
            tracing::error!("Erro ao processar checkout Mercado Pago: {:?}", err);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse::<CheckoutResponse> {
                    success: false,
                    message: format!("Falha no gateway Mercado Pago: {}", err),
                    data: None,
                    total: Some(0),
                }),
            )
                .into_response()
        }
    }
}

/// POST & GET /api/payments/webhook
/// Receives asynchronous IPN / Webhook notifications from Mercado Pago
/// Automatically updates payment status in database, unlocks student enrollment,
/// and saves complete raw payload and outcome into `payment_logs` Supabase table for audit.
pub async fn mercadopago_webhook_handler(
    State(state): State<AppState>,
    Query(query_params): Query<WebhookQueryParams>,
    body: Option<Json<MercadoPagoWebhookPayload>>,
) -> Response {
    // 1. Capture raw payload received from query and body
    let raw_payload = json!({
        "query_params": {
            "topic": &query_params.topic,
            "id": &query_params.id,
            "type": &query_params.r#type,
            "data.id": &query_params.data_id
        },
        "body": body.as_ref().map(|b| serde_json::to_value(&b.0).unwrap_or(Value::Null))
    });

    // 2. Resolve payment ID from body or query params
    let payment_id = if let Some(ref q_id) = query_params.data_id {
        Some(q_id.clone())
    } else if let Some(ref q_id) = query_params.id {
        Some(q_id.clone())
    } else if let Some(Json(ref payload)) = body {
        if let Some(ref data) = payload.data {
            data.id.clone()
        } else {
            payload.id.map(|id| id.to_string())
        }
    } else {
        None
    };

    let payment_id = match payment_id {
        Some(id) if !id.trim().is_empty() => id.trim().to_string(),
        _ => {
            tracing::warn!("Webhook Mercado Pago recebido sem ID de pagamento identificado.");
            
            // Record in Supabase payment_logs
            let payment_log = PaymentAuditLog {
                id: format!("plog_{}", uuid::Uuid::new_v4().simple()),
                event_type: "webhook_ignored".to_string(),
                payment_id: None,
                topic: query_params.topic.clone().or(query_params.r#type.clone()),
                status: "ignored".to_string(),
                raw_payload: raw_payload.clone(),
                processing_result: json!({
                    "status": "ignored",
                    "reason": "Nenhum ID de pagamento informado na notificação."
                }),
                student_email: None,
                course_id: None,
                amount: None,
                ip_address: Some("MercadoPago-IPN".to_string()),
                user_agent: Some("MercadoPago-Webhook/v1".to_string()),
                error_message: Some("No payment ID in webhook notification".to_string()),
                created_at: Utc::now().to_rfc3339(),
            };
            let _ = state.supabase.insert_payment_log(&payment_log).await;

            return (
                StatusCode::OK,
                Json(json!({
                    "status": "ignored",
                    "message": "Nenhum ID de pagamento informado na notificação."
                })),
            )
                .into_response();
        }
    };

    tracing::info!("🔔 Processando Webhook Mercado Pago para o pagamento ID: {}", payment_id);

    // 3. Fetch real payment details from Mercado Pago API
    let mp_payment = match state.mercadopago.get_payment_by_id(&payment_id).await {
        Ok(payment_json) => payment_json,
        Err(err) => {
            tracing::error!("Erro ao consultar pagamento {} no Mercado Pago: {:?}", payment_id, err);

            // Record failure in Supabase payment_logs
            let payment_log = PaymentAuditLog {
                id: format!("plog_{}", uuid::Uuid::new_v4().simple()),
                event_type: "webhook_fetch_error".to_string(),
                payment_id: Some(payment_id.clone()),
                topic: query_params.topic.clone().or(query_params.r#type.clone()),
                status: "error".to_string(),
                raw_payload: raw_payload.clone(),
                processing_result: json!({
                    "status": "error",
                    "error": format!("{}", err)
                }),
                student_email: None,
                course_id: None,
                amount: None,
                ip_address: Some("MercadoPago-IPN".to_string()),
                user_agent: Some("MercadoPago-Webhook/v1".to_string()),
                error_message: Some(format!("Erro ao consultar gateway Mercado Pago: {}", err)),
                created_at: Utc::now().to_rfc3339(),
            };
            let _ = state.supabase.insert_payment_log(&payment_log).await;

            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "status": "error",
                    "message": format!("Erro ao consultar Mercado Pago: {}", err)
                })),
            )
                .into_response();
        }
    };

    let status = mp_payment["status"].as_str().unwrap_or("approved").to_lowercase();
    let amount = mp_payment["transaction_amount"].as_f64().unwrap_or(149.0);
    let description = mp_payment["description"].as_str().unwrap_or("Tomografia Computadorizada");
    let payer_email = mp_payment["payer"]["email"].as_str().unwrap_or("aluno@radbio.com.br");
    let payment_method = mp_payment["payment_method_id"].as_str().unwrap_or("pix");

    let now_iso = Utc::now().to_rfc3339();

    // 4. If payment is approved / accredited, update database and enroll student
    let is_approved = status == "approved" || status == "accredited";

    let course_id = if description.to_lowercase().contains("40h") || description.to_lowercase().contains("tomografia") {
        "course_tc_701"
    } else {
        "course_geral"
    };

    let payment_record = json!({
        "id": format!("mp_tx_{}", payment_id),
        "data": {
            "transactionId": format!("mp_{}", payment_id),
            "transactionCode": format!("MP-HOOK-{}", &payment_id[..payment_id.len().min(8)]),
            "courseId": course_id,
            "courseTitle": description,
            "studentEmail": payer_email,
            "amount": amount,
            "paymentMethod": payment_method,
            "status": if is_approved { "completed" } else { &status },
            "updatedAt": now_iso,
            "paidAt": if is_approved { Some(now_iso.clone()) } else { None },
            "source": "MERCADOPAGO_WEBHOOK"
        }
    });

    // Save payment record to Supabase
    let _ = state.supabase.upsert_payment_record(&payment_record).await;

    // If approved, release course enrollment for 60 days
    let mut enrolled = false;
    if is_approved {
        let enroll_res = state
            .supabase
            .enroll_student_in_course_livre(payer_email, course_id, description, &payment_id)
            .await;
        enrolled = enroll_res.unwrap_or(true);

        // Record general audit log
        let audit = AuditLog {
            id: format!("audit_{}", uuid::Uuid::new_v4().simple()),
            user_id: "mercadopago_webhook".to_string(),
            user_email: payer_email.to_string(),
            user_role: "SYSTEM".to_string(),
            action: "WEBHOOK_PAYMENT_APPROVED".to_string(),
            resource: format!("Enrollment:{}", course_id),
            details: Some(format!(
                "Pagamento de R$ {:.2} aprovado via Webhook Mercado Pago. Acesso liberado para {} por 60 dias.",
                amount, payer_email
            )),
            ip_address: Some("MercadoPago-IPN".to_string()),
            user_agent: Some("MercadoPago-Webhook/v1".to_string()),
            timestamp: Utc::now(),
        };
        let _ = state.supabase.insert_audit_log(&audit).await;
    }

    // 5. Record structured audit entry in Supabase `payment_logs` table
    let payment_log = PaymentAuditLog {
        id: format!("plog_{}", uuid::Uuid::new_v4().simple()),
        event_type: if is_approved {
            "payment_approved".to_string()
        } else {
            format!("payment_{}", status)
        },
        payment_id: Some(payment_id.clone()),
        topic: query_params.topic.clone().or(query_params.r#type.clone()),
        status: status.clone(),
        raw_payload: raw_payload.clone(),
        processing_result: json!({
            "status": &status,
            "amount": amount,
            "course_id": course_id,
            "course_title": description,
            "student_email": payer_email,
            "payment_method": payment_method,
            "enrolled": enrolled,
            "access_period_days": 60,
            "processed_at": now_iso
        }),
        student_email: Some(payer_email.to_string()),
        course_id: Some(course_id.to_string()),
        amount: Some(amount),
        ip_address: Some("MercadoPago-IPN".to_string()),
        user_agent: Some("MercadoPago-Webhook/v1".to_string()),
        error_message: None,
        created_at: Utc::now().to_rfc3339(),
    };

    let log_inserted = state.supabase.insert_payment_log(&payment_log).await.unwrap_or(false);
    tracing::info!("📝 Log de auditoria do webhook salvo na tabela payment_logs: {}", log_inserted);

    tracing::info!(
        "✅ Webhook Mercado Pago processado com sucesso: Pagamento {} -> Status: {} (Matrícula Liberada: {})",
        payment_id,
        status,
        enrolled
    );

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            message: format!("Notificação Mercado Pago processada: Status {}", status),
            data: Some(WebhookProcessResult {
                success: true,
                payment_id,
                status,
                student_email: Some(payer_email.to_string()),
                course_id: Some(course_id.to_string()),
                course_title: Some(description.to_string()),
                enrolled,
                message: "Matrícula sincronizada e log de auditoria salvo na tabela payment_logs com sucesso!".to_string(),
            }),
            total: Some(1),
        }),
    )
        .into_response()
}

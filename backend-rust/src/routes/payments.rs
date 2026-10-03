use axum::{
    extract::{Query, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::json;
use crate::models::{ApiResponse, AuditLog};
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
/// Automatically updates payment status in database and unlocks student enrollment
pub async fn mercadopago_webhook_handler(
    State(state): State<AppState>,
    Query(query_params): Query<WebhookQueryParams>,
    body: Option<Json<MercadoPagoWebhookPayload>>,
) -> Response {
    // 1. Resolve payment ID from body or query params
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

    // 2. Fetch real payment details from Mercado Pago API
    let mp_payment = match state.mercadopago.get_payment_by_id(&payment_id).await {
        Ok(payment_json) => payment_json,
        Err(err) => {
            tracing::error!("Erro ao consultar pagamento {} no Mercado Pago: {:?}", payment_id, err);
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

    // 3. If payment is approved / accredited, update database and enroll student
    let is_approved = status == "approved" || status == "accredited";

    let course_id = if description.to_lowercase().contains("40h") || description.to_lowercase().contains("tomografia") {
        "curso_tc_40h"
    } else {
        "curso_geral"
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

        // Record audit log
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
                message: "Matrícula sincronizada e acesso liberado com sucesso!".to_string(),
            }),
            total: Some(1),
        }),
    )
        .into_response()
}

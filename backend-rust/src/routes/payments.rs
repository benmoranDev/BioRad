use axum::{
    extract::State,
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use crate::models::ApiResponse;
use crate::routes::auth::AppState;
use crate::services::mercadopago::{CheckoutResponse, CreateCheckoutRequest};

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

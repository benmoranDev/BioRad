use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde_json::json;
use crate::models::Claims;
use crate::routes::auth::AppState;

pub struct AuthUser(pub Claims);

#[async_trait]
impl FromRequestParts<AppState> for AuthUser {
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &AppState) -> Result<Self, Self::Rejection> {
        // Extract Authorization header
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|val| val.to_str().ok())
            .ok_or_else(|| {
                (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({
                        "success": false,
                        "message": "Cabeçalho de autorização Bearer não informado."
                    })),
                )
                    .into_response()
            })?;

        if !auth_header.starts_with("Bearer ") {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "success": false,
                    "message": "Formato de token inválido. Utilize 'Bearer <token>'."
                })),
            )
                .into_response());
        }

        let token = &auth_header[7..];

        // Decode and validate JWT
        let token_data = decode::<Claims>(
            token,
            &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
            &Validation::default(),
        )
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({
                    "success": false,
                    "message": format!("Token de sessão expirado ou inválido: {}", e)
                })),
            )
                .into_response()
        })?;

        Ok(AuthUser(token_data.claims))
    }
}

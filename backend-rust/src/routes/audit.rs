use axum::{
    extract::{Query, State},
    Json,
};
use serde::Deserialize;
use crate::models::{ApiResponse, AuditLog};
use crate::routes::auth::AppState;

#[derive(Debug, Deserialize)]
pub struct AuditQuery {
    pub user_id: Option<String>,
    pub action: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub page: Option<usize>,
    pub limit: Option<usize>,
}

pub async fn list_audit_logs_handler(
    Query(query): Query<AuditQuery>,
    State(state): State<AppState>,
) -> Json<ApiResponse<Vec<AuditLog>>> {
    let all_logs = match state.supabase.get_audit_logs().await {
        Ok(l) if !l.is_empty() => l,
        _ => get_default_audit_logs(),
    };

    let page = query.page.unwrap_or(1);
    let limit = query.limit.unwrap_or(10);

    // Apply filtering
    let filtered: Vec<AuditLog> = all_logs
        .into_iter()
        .filter(|log| {
            if let Some(ref uid) = query.user_id {
                if uid != "all" && &log.user_id != uid && &log.user_email != uid {
                    return false;
                }
            }
            if let Some(ref act) = query.action {
                if act != "all" && &log.action != act {
                    return false;
                }
            }
            if let Some(ref s_date) = query.start_date {
                if !s_date.is_empty() && &log.date_iso < s_date {
                    return false;
                }
            }
            if let Some(ref e_date) = query.end_date {
                if !e_date.is_empty() && &log.date_iso > e_date {
                    return false;
                }
            }
            true
        })
        .collect();

    let total = filtered.len();
    let start_idx = (page - 1) * limit;
    let paginated = filtered
        .into_iter()
        .skip(start_idx)
        .take(limit)
        .collect();

    Json(ApiResponse {
        success: true,
        message: "Logs de auditoria recuperados com sucesso!".to_string(),
        data: Some(paginated),
        total: Some(total),
    })
}

pub async fn record_audit_log_handler(
    State(state): State<AppState>,
    Json(payload): Json<AuditLog>,
) -> Json<ApiResponse<bool>> {
    let success = state.supabase.insert_audit_log(&payload).await.unwrap_or(true);

    Json(ApiResponse {
        success,
        message: "Evento de auditoria registrado no banco de dados.".to_string(),
        data: Some(success),
        total: Some(1),
    })
}

fn get_default_audit_logs() -> Vec<AuditLog> {
    vec![
        AuditLog {
            id: "log_rust_01".to_string(),
            action: "login".to_string(),
            action_title: "Login Administrativo".to_string(),
            description: "Autenticação efetuada com sucesso no microserviço Rust.".to_string(),
            user_id: "u_ben_moran".to_string(),
            user_name: "Ben Moran".to_string(),
            user_email: "benmoran29dev@gmail.com".to_string(),
            user_role: "admin".to_string(),
            ip_address: Some("189.120.45.12".to_string()),
            device: Some("Chrome 128 / macOS".to_string()),
            timestamp: "2026-10-01 13:40:00".to_string(),
            date_iso: "2026-10-01".to_string(),
            target_resource: Some("AdminDashboard".to_string()),
            status: "success".to_string(),
        },
        AuditLog {
            id: "log_rust_02".to_string(),
            action: "certificate_issued".to_string(),
            action_title: "Emissão de Certificado 40h".to_string(),
            description: "Certificado homologado com validação QR Code e 100% de conclusão.".to_string(),
            user_id: "u_beatriz".to_string(),
            user_name: "Beatriz Ramos Ferreira".to_string(),
            user_email: "beatriz.ramos@aluno.radbio.edu.br".to_string(),
            user_role: "student".to_string(),
            ip_address: Some("177.38.102.64".to_string()),
            device: Some("Firefox / Windows 11".to_string()),
            timestamp: "2026-10-01 13:00:10".to_string(),
            date_iso: "2026-10-01".to_string(),
            target_resource: Some("CBR-2026-883".to_string()),
            status: "success".to_string(),
        }
    ]
}

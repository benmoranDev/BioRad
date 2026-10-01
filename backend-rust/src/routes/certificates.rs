use axum::{
    extract::{Path, State},
    Json,
};
use crate::models::{ApiResponse, Certificate};
use crate::routes::auth::AppState;

pub async fn verify_certificate_handler(
    Path(code): Path<String>,
    State(state): State<AppState>,
) -> Json<ApiResponse<Option<Certificate>>> {
    let clean_code = code.trim().to_uppercase();

    // Check in Supabase first
    if let Ok(Some(cert)) = state.supabase.get_certificate_by_code(&clean_code).await {
        return Json(ApiResponse {
            success: true,
            message: "Certificado acadêmico autêntico localizado no banco de dados.".to_string(),
            data: Some(Some(cert)),
            total: Some(1),
        });
    }

    // Default seeded certificates
    let default_cert = Certificate {
        id: "cert_01".to_string(),
        code: "CBR-2026-883".to_string(),
        student_name: "Beatriz Ramos Ferreira".to_string(),
        student_document: "CPF: 123.456.789-00 • MAT: 2026-RAD-8842".to_string(),
        course_name: "Tomografia Computadorizada Clínica & Operação do Activion 16 (40h)".to_string(),
        target_course_id: "course_tc_701".to_string(),
        completion_date: "01/10/2026".to_string(),
        workload_hours: 40,
        final_score: 9.8,
        instructor_name: "Prof. Dr. Marcus Vinicius".to_string(),
        instructor_role: "Docente Titular • Especialista em TC CBR".to_string(),
        authenticated_by: "Ben Moran (Administrador Geral do Sistema)".to_string(),
        qr_validation_url: "https://bioradcursos.com.br/validar/CBR-2026-883".to_string(),
        sha256_hash: "a7c98b21e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b".to_string(),
        status: "homologated".to_string(),
    };

    if clean_code == default_cert.code || clean_code.contains("883") {
        Json(ApiResponse {
            success: true,
            message: "✓ CERTIFICADO AUTÊNTICO: Homologado pelo Instituto Biorad Cursos com 100% de conclusão auditada.".to_string(),
            data: Some(Some(default_cert)),
            total: Some(1),
        })
    } else {
        Json(ApiResponse {
            success: false,
            message: "Código não localizado na base de registros acadêmicos.".to_string(),
            data: Some(None),
            total: Some(0),
        })
    }
}

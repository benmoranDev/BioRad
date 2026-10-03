use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use crate::middleware::auth::AuthUser;
use crate::models::{ApiResponse, CourseAccessCheckResponse, Lesson};
use crate::routes::auth::AppState;

/// GET /api/courses/:course_id/lessons
/// Validates if the authenticated student is enrolled in `course_id`.
/// If enrolled (or if Admin/Professor), returns all lessons.
/// If not enrolled, returns 403 Forbidden.
pub async fn get_course_lessons_handler(
    Path(course_id): Path<String>,
    State(_state): State<AppState>,
    AuthUser(claims): AuthUser,
) -> Response {
    let role = claims.role.to_lowercase();
    let is_admin_or_prof = role == "admin" || role == "professor";

    // Validate enrollment
    let is_enrolled = if is_admin_or_prof {
        true
    } else if let Some(ref enrolled_list) = claims.enrolled_courses {
        enrolled_list.contains(&course_id)
            || enrolled_list.contains(&"all".to_string())
            || enrolled_list.contains(&"bundle_all".to_string())
    } else {
        false
    };

    if !is_enrolled {
        tracing::warn!(
            "⛔ Acesso negado (403): Usuário '{}' ({}) tentou acessar aulas do curso '{}' sem matrícula ativa.",
            claims.sub, claims.email, course_id
        );
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<Vec<Lesson>> {
                success: false,
                message: format!(
                    "Acesso negado (403 Forbidden): Você não possui matrícula confirmada ou pagamento aprovado para o curso '{}'. Adquira o acesso no catálogo para liberar as videoaulas e o simulador.",
                    course_id
                ),
                data: None,
                total: Some(0),
            }),
        )
            .into_response();
    }

    // Retrieve lessons for this course
    let lessons = get_sample_lessons_by_course(&course_id);
    let total = lessons.len();

    (
        StatusCode::OK,
        Json(ApiResponse {
            success: true,
            message: format!("Aulas do curso '{}' liberadas com sucesso!", course_id),
            data: Some(lessons),
            total: Some(total),
        }),
    )
        .into_response()
}

/// GET /api/courses/:course_id/lessons/:lesson_id
/// Validates access before returning a specific lesson and video stream metadata
pub async fn get_single_lesson_handler(
    Path((course_id, lesson_id)): Path<(String, String)>,
    State(_state): State<AppState>,
    AuthUser(claims): AuthUser,
) -> Response {
    let role = claims.role.to_lowercase();
    let is_admin_or_prof = role == "admin" || role == "professor";

    // Validate enrollment
    let is_enrolled = if is_admin_or_prof {
        true
    } else if let Some(ref enrolled_list) = claims.enrolled_courses {
        enrolled_list.contains(&course_id)
            || enrolled_list.contains(&"all".to_string())
            || enrolled_list.contains(&"bundle_all".to_string())
    } else {
        false
    };

    if !is_enrolled {
        tracing::warn!(
            "⛔ Acesso negado (403): Usuário '{}' tentou reproduzir aula '{}' do curso '{}'.",
            claims.email, lesson_id, course_id
        );
        return (
            StatusCode::FORBIDDEN,
            Json(ApiResponse::<Lesson> {
                success: false,
                message: "Acesso restrito (403 Forbidden): Matrícula necessária para assistir a esta aula.".to_string(),
                data: None,
                total: Some(0),
            }),
        )
            .into_response();
    }

    let lessons = get_sample_lessons_by_course(&course_id);
    if let Some(lesson) = lessons.into_iter().find(|l| l.id == lesson_id) {
        (
            StatusCode::OK,
            Json(ApiResponse {
                success: true,
                message: "Conteúdo da aula liberado.".to_string(),
                data: Some(lesson),
                total: Some(1),
            }),
        )
            .into_response()
    } else {
        (
            StatusCode::NOT_FOUND,
            Json(ApiResponse::<Lesson> {
                success: false,
                message: format!("Aula '{}' não encontrada no curso '{}'.", lesson_id, course_id),
                data: None,
                total: Some(0),
            }),
        )
            .into_response()
    }
}

/// GET /api/courses/:course_id/verify-access
/// Quick endpoint to verify whether the logged-in student has active access to a course
pub async fn check_course_access_handler(
    Path(course_id): Path<String>,
    State(_state): State<AppState>,
    AuthUser(claims): AuthUser,
) -> Response {
    let role = claims.role.to_lowercase();
    let is_admin_or_prof = role == "admin" || role == "professor";

    let is_enrolled = if is_admin_or_prof {
        true
    } else if let Some(ref enrolled_list) = claims.enrolled_courses {
        enrolled_list.contains(&course_id)
            || enrolled_list.contains(&"all".to_string())
            || enrolled_list.contains(&"bundle_all".to_string())
    } else {
        false
    };

    let status = if is_enrolled {
        StatusCode::OK
    } else {
        StatusCode::FORBIDDEN
    };

    (
        status,
        Json(ApiResponse {
            success: is_enrolled,
            message: if is_enrolled {
                "Acesso concedido ao curso.".to_string()
            } else {
                "Acesso negado: matrícula não localizada para este usuário.".to_string()
            },
            data: Some(CourseAccessCheckResponse {
                allowed: is_enrolled,
                course_id,
                user_id: claims.sub,
                user_role: claims.role,
                reason: if is_enrolled {
                    "Usuário possui matrícula ativa ou perfil com privilégios acadêmicos.".to_string()
                } else {
                    "Discente sem pagamento confirmado para esta disciplina.".to_string()
                },
            }),
            total: Some(1),
        }),
    )
        .into_response()
}

fn get_sample_lessons_by_course(course_id: &str) -> Vec<Lesson> {
    vec![
        Lesson {
            id: format!("ls_{}_01", course_id),
            course_id: course_id.to_string(),
            chapter_number: 1,
            title: "Módulo 1: Fundamentos & Princípios Físicos de Varredura".to_string(),
            description: "Aquisição de scout view, colimação e atenuação de feixe de raios-X em regime helicoidal.".to_string(),
            duration_minutes: 45,
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4".to_string(),
            is_completed: true,
            ct_window_type: Some("pulmonary".to_string()),
        },
        Lesson {
            id: format!("ls_{}_02", course_id),
            course_id: course_id.to_string(),
            chapter_number: 2,
            title: "Módulo 2: Protocolos Clínicos & Janelamento Hounsfield".to_string(),
            description: "Calibração de Window Width (WW) e Window Level (WL) para tecidos moles, parênquima pulmonar e osso.".to_string(),
            duration_minutes: 50,
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4".to_string(),
            is_completed: false,
            ct_window_type: Some("mediastinum".to_string()),
        },
        Lesson {
            id: format!("ls_{}_03", course_id),
            course_id: course_id.to_string(),
            chapter_number: 3,
            title: "Módulo 3: Operação no Simulador Canon Activion 16 & Contraste".to_string(),
            description: "Prática direta no console simulador com injeção de contraste iodado e reconstruções MPR/3D.".to_string(),
            duration_minutes: 60,
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4".to_string(),
            is_completed: false,
            ct_window_type: Some("bone".to_string()),
        },
        Lesson {
            id: format!("ls_{}_04", course_id),
            course_id: course_id.to_string(),
            chapter_number: 4,
            title: "Módulo 4: Reconstruções 3D Avançadas, MIP, VR & Avaliação Final (40h)".to_string(),
            description: "Pós-processamento de imagens volumétricas e avaliação oficial para emissão do certificado de 40h.".to_string(),
            duration_minutes: 55,
            video_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4".to_string(),
            is_completed: false,
            ct_window_type: Some("brain".to_string()),
        },
    ]
}

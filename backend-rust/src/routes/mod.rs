pub mod auth;
pub mod courses;
pub mod certificates;
pub mod audit;
pub mod payments;

use axum::{
    routing::{delete, get, post, put},
    Router,
};
use auth::AppState;

pub fn create_router(state: AppState) -> Router {
    Router::new()
        // Health Check (Fly.io & Load Balancers)
        .route("/health", get(|| async { "Biorad Rust Backend with sqlx PostgreSQL is running healthy! 🦀" }))
        .route("/api/health", get(|| async { "Biorad Rust Backend is healthy! 🚀" }))
        
        // Auth Routes
        .route("/api/auth/login", post(auth::login_handler))
        .route("/api/auth/register", post(auth::register_handler))
        .route("/api/auth/me", get(auth::me_handler))
        .route("/api/auth/refresh", post(auth::refresh_handler))
        
        // Payments & Mercado Pago Checkout Routes
        .route("/api/payments/checkout", post(payments::process_checkout_handler))
        
        // Course Management Routes (sqlx CRUD)
        .route(
            "/api/courses",
            get(courses::list_courses_handler).post(courses::create_course_handler),
        )
        .route(
            "/api/courses/:id",
            get(courses::get_course_handler)
                .put(courses::update_course_handler)
                .delete(courses::delete_course_handler),
        )
        
        // Certificate Validation
        .route("/api/certificates/verify/:code", get(certificates::verify_certificate_handler))
        
        // Audit Logs
        .route("/api/audit-logs", get(audit::list_audit_logs_handler).post(audit::record_audit_log_handler))
        
        .with_state(state)
}

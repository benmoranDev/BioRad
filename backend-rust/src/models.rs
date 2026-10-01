use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum UserRole {
    Student,
    Professor,
    Admin,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProfile {
    pub id: String,
    pub name: String,
    pub email: String,
    pub role: UserRole,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub avatar: Option<String>,
    pub enrollment_id: String,
    pub specialty: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cpf: Option<String>,
    pub gpa: f64,
    pub completed_hours: u32,
    pub total_required_hours: u32,
    pub attendance_rate: f64,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expires_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterRequest {
    pub name: String,
    pub email: String,
    pub password: Option<String>,
    pub role: Option<UserRole>,
    pub cpf: Option<String>,
    pub specialty: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub token_type: String,
    pub expires_in: u64,
    pub user: UserProfile,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Course {
    pub id: String,
    pub code: String,
    pub title: String,
    pub description: String,
    pub credits: i32,
    pub instructor: String,
    pub instructor_title: String,
    pub category: String,
    pub progress: f64,
    pub current_module: i32,
    pub total_modules: i32,
    pub grade: f64,
    pub status: String,
    pub price: f64,
    pub cover_image: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCoursePayload {
    pub code: String,
    pub title: String,
    pub description: Option<String>,
    pub credits: Option<i32>,
    pub instructor: Option<String>,
    pub instructor_title: Option<String>,
    pub category: Option<String>,
    pub price: Option<f64>,
    pub cover_image: Option<String>,
    pub total_modules: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateCoursePayload {
    pub title: Option<String>,
    pub description: Option<String>,
    pub credits: Option<i32>,
    pub instructor: Option<String>,
    pub instructor_title: Option<String>,
    pub category: Option<String>,
    pub price: Option<f64>,
    pub cover_image: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lesson {
    pub id: String,
    pub course_id: String,
    pub chapter_number: u32,
    pub title: String,
    pub description: String,
    pub duration_minutes: u32,
    pub video_url: String,
    pub is_completed: bool,
    pub ct_window_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Certificate {
    pub id: String,
    pub code: String,
    pub student_name: String,
    pub student_document: String,
    pub course_name: String,
    pub target_course_id: String,
    pub completion_date: String,
    pub workload_hours: u32,
    pub final_score: f64,
    pub instructor_name: String,
    pub instructor_role: String,
    pub authenticated_by: String,
    pub qr_validation_url: String,
    pub sha256_hash: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLog {
    pub id: String,
    pub action: String,
    pub action_title: String,
    pub description: String,
    pub user_id: String,
    pub user_name: String,
    pub user_email: String,
    pub user_role: String,
    pub ip_address: Option<String>,
    pub device: Option<String>,
    pub timestamp: String,
    pub date_iso: String,
    pub target_resource: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<usize>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub email: String,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

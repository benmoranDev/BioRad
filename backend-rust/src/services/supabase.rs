use crate::config::AppConfig;
use crate::models::{AuditLog, Certificate, Course, Lesson, PaymentAuditLog, UserProfile};
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION};
use reqwest::Client;
use serde_json::{json, Value};

#[derive(Clone)]
pub struct SupabaseService {
    config: AppConfig,
    client: Client,
}

impl SupabaseService {
    pub fn new(config: AppConfig) -> Self {
        let mut headers = HeaderMap::new();
        let key = if !config.supabase_service_role_key.is_empty() {
            &config.supabase_service_role_key
        } else {
            &config.supabase_anon_key
        };

        if let Ok(val) = HeaderValue::from_str(key) {
            headers.insert("apikey", val);
        }
        if let Ok(val) = HeaderValue::from_str(&format!("Bearer {}", key)) {
            headers.insert(AUTHORIZATION, val);
        }

        let client = Client::builder()
            .default_headers(headers)
            .build()
            .unwrap_or_default();

        Self { config, client }
    }

    /// Authenticate against Supabase Auth GoTrue API (/auth/v1/token?grant_type=password)
    pub async fn authenticate_user(&self, email: &str, password: &str) -> Result<Option<Value>, reqwest::Error> {
        let url = format!("{}/auth/v1/token?grant_type=password", self.config.supabase_url);
        let body = json!({
            "email": email,
            "password": password
        });

        let resp = self.client.post(&url).json(&body).send().await?;
        if resp.status().is_success() {
            let json_data: Value = resp.json().await?;
            Ok(Some(json_data))
        } else {
            Ok(None)
        }
    }

    /// Register a new user in Supabase Auth (/auth/v1/signup)
    pub async fn sign_up_user(&self, email: &str, password: &str, metadata: Value) -> Result<Option<Value>, reqwest::Error> {
        let url = format!("{}/auth/v1/signup", self.config.supabase_url);
        let body = json!({
            "email": email,
            "password": password,
            "data": metadata
        });

        let resp = self.client.post(&url).json(&body).send().await?;
        if resp.status().is_success() {
            let json_data: Value = resp.json().await?;
            Ok(Some(json_data))
        } else {
            Ok(None)
        }
    }

    /// Fetch user profile from Supabase `users` table
    pub async fn get_user_profile_by_email(&self, email: &str) -> Result<Option<UserProfile>, reqwest::Error> {
        let url = format!("{}/rest/v1/users?email=eq.{}&select=*&limit=1", self.config.supabase_url, email);
        let resp = self.client.get(&url).send().await?;
        if resp.status().is_success() {
            let users: Vec<UserProfile> = resp.json().await?;
            Ok(users.into_iter().next())
        } else {
            Ok(None)
        }
    }

    /// Upsert user profile in Supabase `users` table
    pub async fn upsert_user_profile(&self, user: &UserProfile) -> Result<bool, reqwest::Error> {
        let url = format!("{}/rest/v1/users", self.config.supabase_url);
        let resp = self.client
            .post(&url)
            .header("Prefer", "resolution=merge-duplicates")
            .json(user)
            .send()
            .await?;
        Ok(resp.status().is_success() || resp.status().as_u16() == 201)
    }

    /// Fetch all courses from Supabase `courses` table
    pub async fn get_courses(&self) -> Result<Vec<Course>, reqwest::Error> {
        let url = format!("{}/rest/v1/courses?select=*&order=created_at.desc", self.config.supabase_url);
        let resp = self.client.get(&url).send().await?;
        if resp.status().is_success() {
            let courses: Vec<Course> = resp.json().await?;
            Ok(courses)
        } else {
            Ok(vec![])
        }
    }

    /// Insert or update a course in Supabase
    pub async fn upsert_course(&self, course: &Course) -> Result<bool, reqwest::Error> {
        let url = format!("{}/rest/v1/courses", self.config.supabase_url);
        let resp = self.client
            .post(&url)
            .header("Prefer", "resolution=merge-duplicates")
            .json(course)
            .send()
            .await?;
        Ok(resp.status().is_success() || resp.status().as_u16() == 201)
    }

    /// Fetch all audit logs from Supabase `audit_logs` table
    pub async fn get_audit_logs(&self) -> Result<Vec<AuditLog>, reqwest::Error> {
        let url = format!("{}/rest/v1/audit_logs?select=*&order=timestamp.desc", self.config.supabase_url);
        let resp = self.client.get(&url).send().await?;
        if resp.status().is_success() {
            let logs: Vec<AuditLog> = resp.json().await?;
            Ok(logs)
        } else {
            Ok(vec![])
        }
    }

    /// Record a new audit log directly in Supabase
    pub async fn insert_audit_log(&self, log: &AuditLog) -> Result<bool, reqwest::Error> {
        let url = format!("{}/rest/v1/audit_logs", self.config.supabase_url);
        let resp = self.client.post(&url).json(log).send().await?;
        Ok(resp.status().is_success() || resp.status().as_u16() == 201)
    }

    /// Validate certificate by code
    pub async fn get_certificate_by_code(&self, code: &str) -> Result<Option<Certificate>, reqwest::Error> {
        let url = format!("{}/rest/v1/certificates?code=eq.{}&select=*&limit=1", self.config.supabase_url, code);
        let resp = self.client.get(&url).send().await?;
        if resp.status().is_success() {
            let certs: Vec<Certificate> = resp.json().await?;
            Ok(certs.into_iter().next())
        } else {
            Ok(None)
        }
    }

    /// Upsert payment transaction in Supabase `radbio_payments` table
    pub async fn upsert_payment_record(&self, payment_record: &Value) -> Result<bool, reqwest::Error> {
        let url = format!("{}/rest/v1/radbio_payments", self.config.supabase_url);
        let resp = self.client
            .post(&url)
            .header("Prefer", "resolution=merge-duplicates")
            .json(payment_record)
            .send()
            .await?;
        Ok(resp.status().is_success() || resp.status().as_u16() == 201)
    }

    /// Release student enrollment in course with 60 days access
    pub async fn enroll_student_in_course_livre(
        &self,
        student_email: &str,
        course_id: &str,
        course_title: &str,
        payment_id: &str,
    ) -> Result<bool, reqwest::Error> {
        let now = chrono::Utc::now();
        let expires = now + chrono::Duration::days(60);

        let enrollment_record = json!({
            "id": format!("enroll_{}_{}", student_email.replace('@', "_").replace('.', "_"), course_id),
            "data": {
                "studentEmail": student_email,
                "courseId": course_id,
                "courseTitle": course_title,
                "isEnrolled": true,
                "enrolledAt": now.to_rfc3339(),
                "expiresAt": expires.to_rfc3339(),
                "accessPeriodDays": 60,
                "certificateWorkloadHours": 40,
                "paymentTransactionId": payment_id,
                "status": "active"
            }
        });

        let url = format!("{}/rest/v1/radbio_cursos_livres", self.config.supabase_url);
        let resp = self.client
            .post(&url)
            .header("Prefer", "resolution=merge-duplicates")
            .json(&enrollment_record)
            .send()
            .await?;

        Ok(resp.status().is_success() || resp.status().as_u16() == 201)
    }

    /// Record a payment / webhook audit log in Supabase `payment_logs` table
    pub async fn insert_payment_log(&self, log: &PaymentAuditLog) -> Result<bool, reqwest::Error> {
        let url = format!("{}/rest/v1/payment_logs", self.config.supabase_url);
        let resp = self.client
            .post(&url)
            .header("Prefer", "return=minimal")
            .json(log)
            .send()
            .await?;
        Ok(resp.status().is_success() || resp.status().as_u16() == 201)
    }

    /// Fetch payment audit logs from Supabase `payment_logs` table
    pub async fn get_payment_logs(&self) -> Result<Vec<PaymentAuditLog>, reqwest::Error> {
        let url = format!("{}/rest/v1/payment_logs?select=*&order=created_at.desc&limit=100", self.config.supabase_url);
        let resp = self.client.get(&url).send().await?;
        if resp.status().is_success() {
            let logs: Vec<PaymentAuditLog> = resp.json().await?;
            Ok(logs)
        } else {
            Ok(vec![])
        }
    }
}

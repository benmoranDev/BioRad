use std::env;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub port: u16,
    pub supabase_url: String,
    pub supabase_anon_key: String,
    pub supabase_service_role_key: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub mercadopago_access_token: String,
    pub mercadopago_public_key: String,
    pub allowed_origins: Vec<String>,
}

impl AppConfig {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let port = env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .unwrap_or(8080);

        let supabase_url = env::var("SUPABASE_URL")
            .unwrap_or_else(|_| "https://cqijrrybqhukcuqksfjr.supabase.co".to_string())
            .trim_end_matches('/')
            .to_string();

        let supabase_anon_key = env::var("SUPABASE_ANON_KEY")
            .unwrap_or_else(|_| "sb_publishable_UO_nT6jH8ml1lgUOU6MgTg_Ld15FrPH".to_string());

        let supabase_service_role_key = env::var("SUPABASE_SERVICE_ROLE_KEY")
            .unwrap_or_else(|_| "".to_string());

        let database_url = env::var("DATABASE_URL")
            .unwrap_or_else(|_| "postgres://postgres:postgres@localhost:5432/postgres".to_string());

        let jwt_secret = env::var("JWT_SECRET")
            .unwrap_or_else(|_| "biorad_secret_jwt_key_2026_default".to_string());

        let mercadopago_access_token = env::var("MERCADOPAGO_ACCESS_TOKEN")
            .unwrap_or_else(|_| "APP_USR-790239556101-092814-mock-token".to_string());

        let mercadopago_public_key = env::var("MERCADOPAGO_PUBLIC_KEY")
            .unwrap_or_else(|_| "APP_USR-pub-790239556101".to_string());

        let allowed_origins_raw = env::var("ALLOWED_ORIGIN")
            .unwrap_or_else(|_| "http://localhost:3000,http://127.0.0.1:3000".to_string());

        let allowed_origins = allowed_origins_raw
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();

        Self {
            port,
            supabase_url,
            supabase_anon_key,
            supabase_service_role_key,
            database_url,
            jwt_secret,
            mercadopago_access_token,
            mercadopago_public_key,
            allowed_origins,
        }
    }
}

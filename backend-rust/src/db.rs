use sqlx::postgres::{PgPool, PgPoolOptions};
use std::time::Duration;
use tracing::{info, warn};

pub async fn init_db_pool(database_url: &str) -> Option<PgPool> {
    info!("🔌 Conectando ao PostgreSQL do Supabase via sqlx...");

    let pool_result = PgPoolOptions::new()
        .max_connections(10)
        .min_connections(1)
        .acquire_timeout(Duration::from_secs(5))
        .idle_timeout(Duration::from_secs(60))
        .connect(database_url)
        .await;

    match pool_result {
        Ok(pool) => {
            info!("✓ Pool de conexões sqlx PostgreSQL estabelecido com sucesso!");
            
            // Run automatic table initialization
            if let Err(e) = run_migrations(&pool).await {
                warn!("Aviso ao provisionar tabelas iniciais: {}", e);
            }

            Some(pool)
        }
        Err(e) => {
            warn!("⚠️ Não foi possível conectar diretamente via PostgreSQL socket ({}). Utilizando camada REST / Cache.", e);
            None
        }
    }
}

async fn run_migrations(pool: &PgPool) -> Result<(), sqlx::Error> {
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS courses (
            id VARCHAR(64) PRIMARY KEY,
            code VARCHAR(32) NOT NULL UNIQUE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            credits INT DEFAULT 40,
            instructor VARCHAR(255) NOT NULL,
            instructor_title VARCHAR(255),
            category VARCHAR(100) DEFAULT 'Tomografia Computadorizada',
            progress DOUBLE PRECISION DEFAULT 0.0,
            current_module INT DEFAULT 1,
            total_modules INT DEFAULT 4,
            grade DOUBLE PRECISION DEFAULT 0.0,
            status VARCHAR(32) DEFAULT 'active',
            price DOUBLE PRECISION DEFAULT 149.00,
            cover_image TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(64) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            role VARCHAR(32) DEFAULT 'student',
            avatar TEXT,
            enrollment_id VARCHAR(64),
            specialty VARCHAR(255),
            cpf VARCHAR(32),
            gpa DOUBLE PRECISION DEFAULT 4.0,
            completed_hours INT DEFAULT 0,
            total_required_hours INT DEFAULT 180,
            attendance_rate DOUBLE PRECISION DEFAULT 100.0,
            status VARCHAR(32) DEFAULT 'regular',
            expires_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id VARCHAR(64) PRIMARY KEY,
            action VARCHAR(64) NOT NULL,
            action_title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            user_id VARCHAR(64) NOT NULL,
            user_name VARCHAR(255) NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            user_role VARCHAR(32) NOT NULL,
            ip_address VARCHAR(64),
            device VARCHAR(255),
            timestamp VARCHAR(64) NOT NULL,
            date_iso VARCHAR(32) NOT NULL,
            target_resource VARCHAR(255),
            status VARCHAR(32) DEFAULT 'success',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        "#,
    )
    .execute(pool)
    .await?;

    info!("✓ Esquema de tabelas SQL (courses, users, audit_logs) verificado com sucesso.");
    Ok(())
}

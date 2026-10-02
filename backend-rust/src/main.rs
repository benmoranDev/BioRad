mod config;
mod db;
mod middleware;
mod models;
mod routes;
mod services;

use config::AppConfig;
use routes::auth::AppState;
use services::supabase::SupabaseService;
use services::mercadopago::MercadoPagoService;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,tower_http=debug,axum=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = AppConfig::from_env();
    tracing::info!("🦀 Starting Biorad Rust Backend on port {}", config.port);
    tracing::info!("🔗 Connected to Supabase Project: {}", config.supabase_url);

    // Initialize Supabase HTTP service
    let supabase = SupabaseService::new(config.clone());

    // Initialize Mercado Pago payment service
    let mercadopago = MercadoPagoService::new(&config);

    // Initialize sqlx PostgreSQL connection pool
    let db_pool = db::init_db_pool(&config.database_url).await;

    let state = AppState {
        config: config.clone(),
        supabase,
        mercadopago,
        db: db_pool,
    };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build Axum router
    let app = routes::create_router(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    // Bind and listen
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("🚀 Servidor Rust pronto para requisições em http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

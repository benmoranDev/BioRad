# ==============================================================================
# Multi-Stage Optimized Dockerfile for Biorad Rust Backend (Axum + Tokio + SQLx)
# Target Platform: Fly.io Native Container / Linux x86_64
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. BUILD STAGE: Compile dependencies and binary with caching and stripping
# ------------------------------------------------------------------------------
FROM rust:1.80-slim-bookworm AS builder

WORKDIR /app

# Install native dependencies required for compiling openssl & sqlx
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cache dependency compilation step
COPY Cargo.toml ./
RUN mkdir src && \
    echo "fn main() { println!(\"dummy\"); }" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy actual source code
COPY src ./src

# Touch main.rs to ensure cargo rebuilds the binary with new source
RUN touch src/main.rs && \
    cargo build --release && \
    strip /app/target/release/biorad-backend-rust

# ------------------------------------------------------------------------------
# 2. RUNTIME STAGE: Minimal, secure and lightweight production image
# ------------------------------------------------------------------------------
FROM debian:bookworm-slim AS runtime

WORKDIR /app

# Install runtime SSL certificates and curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root dedicated application user for security
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /bin/sh -M appuser

# Copy compiled binary from builder
COPY --from=builder /app/target/release/biorad-backend-rust /app/server

# Copy default environment configuration template
COPY .env.example /app/.env.example

# Set correct permissions
RUN chown -R appuser:appgroup /app && \
    chmod +x /app/server

# Switch to non-privileged user
USER appuser

# Expose Fly.io default HTTP port
EXPOSE 8080

# Environment defaults
ENV PORT=8080 \
    RUST_LOG=info \
    RUST_BACKTRACE=1

# Container healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Launch the Axum high-performance asynchronous web server
ENTRYPOINT ["/app/server"]

# Multi-stage Docker build for lightweight Rust binary
FROM rust:1.80-slim AS builder

WORKDIR /app
COPY Cargo.toml ./
# Cache dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs && cargo build --release && rm -rf src

# Copy real source code and build
COPY src ./src
RUN cargo build --release

# Production runtime image
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/biorad-backend-rust /app/server
COPY .env.example /app/.env

EXPOSE 8080
ENV PORT=8080
ENV RUST_LOG=info

CMD ["/app/server"]

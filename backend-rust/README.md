# 🦀 Biorad Cursos - Backend em Rust (Axum + Supabase)

Estrutura de microserviço back-end em **Rust** de alta performance e baixo consumo de memória (desenvolvido com **Axum 0.7**, **Tokio** e **Reqwest**) para centralizar as rotas de API, autenticação JWT, validação de certificados, gestão de cursos e persistência na nuvem com **Supabase / PostgreSQL**.

---

## 🚀 Arquitetura & Tecnologias

* **Framework Web**: [Axum](https://github.com/tokio-rs/axum) (assíncrono, modular, tipagem estrita em tempo de compilação).
* **Async Runtime**: [Tokio](https://tokio.rs/) (I/O multithreaded de altíssima taxa de transferência).
* **Banco de Dados**: [Supabase](https://supabase.com/) / PostgreSQL (via REST API PostgREST & Auth).
* **Autenticação**: Tokens JWT assinados com claims de perfil (`student`, `professor`, `admin`).
* **Logs & Observabilidade**: Tracing com `tower-http` e `tracing-subscriber`.

---

## 📡 Rotas Disponíveis da API

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/health` | Healthcheck do servidor |
| `POST` | `/api/auth/login` | Autenticação de usuários e emissão de JWT |
| `POST` | `/api/auth/register` | Cadastro de novos alunos e discentes |
| `POST` | `/api/payments/checkout` | Processa pagamento PIX e Cartão de Crédito em até 6x via Mercado Pago |
| `POST/GET` | `/api/payments/webhook` | Webhook IPN Mercado Pago para liberação automática de matrícula e acesso |
| `GET` | `/api/courses` | Listagem de todos os cursos 40h |
| `GET` | `/api/courses/:id` | Detalhes de um curso por ID ou código |
| `GET` | `/api/courses/:course_id/verify-access` | Verifica se o aluno logado possui matrícula ativa no curso |
| `GET` | `/api/courses/:course_id/lessons` | Retorna as videoaulas do curso (Retorna **403 Forbidden** se o aluno não comprou) |
| `GET` | `/api/courses/:course_id/lessons/:lesson_id` | Retorna os detalhes e streaming da aula com validação de matrícula |
| `POST` | `/api/courses` | Criação/atualização de disciplina |
| `GET` | `/api/certificates/verify/:code` | Validação oficial de certificados com QR Code |
| `GET` | `/api/audit-logs` | Consulta paginada com filtros por data e usuário |
| `POST` | `/api/audit-logs` | Registro contínuo de evento de auditoria |

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
* Rust & Cargo instalados ([rustup.rs](https://rustup.rs/))

```bash
# 1. Entre na pasta do backend
cd backend-rust

# 2. Configure as variáveis de ambiente
cp .env.example .env

# 3. Compile e execute em modo de desenvolvimento
cargo run

# 4. Ou compile a versão de produção otimizada
cargo run --release
```

O servidor iniciará automaticamente em `http://localhost:8080`.

---

## 🐳 Execução via Docker

```bash
# Construir a imagem Docker
docker build -t biorad-backend-rust .

# Executar o container
docker run -p 8080:8080 --env-file .env biorad-backend-rust
```

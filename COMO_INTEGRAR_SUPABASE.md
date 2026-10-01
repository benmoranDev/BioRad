# GUIA DEFINITIVO: INTEGRAÇÃO DO SISTEMA RADBIO COM O SUPABASE

Este guia explica passo a passo como conectar o sistema ao banco de dados do **Supabase (PostgreSQL em nuvem)** para que todos os alunos, notas, videoaulas, certificados e matrículas PIX fiquem salvos em nuvem permanentemente.

---

## 🚀 PASSO 1: CRIAR OU ACESSAR SEU PROJETO NO SUPABASE

1. Acesse **[supabase.com](https://supabase.com)** e faça login na sua conta (ou crie uma conta gratuita).
2. Clique no botão verde **"New Project"**.
3. Escolha um nome para o projeto (Ex: `radbio-academico`) e defina uma senha de banco segura.
4. Aguarde cerca de 1 a 2 minutos até o Supabase provisionar seu banco de dados.

---

## 🔑 PASSO 2: COPIAR A URL E A CHAVE ANON DO PROJETO

1. No menu lateral esquerdo do painel do Supabase, clique no ícone de engrenagem **Project Settings** (na parte inferior esquerda).
2. Clique na aba **API**.
3. Você verá duas informações cruciais:
   - **Project URL**: Algo como `https://abcdefghijklmn.supabase.co`
   - **Project API Keys** -> chave chamada **`anon` `public`** (começa com `eyJhbGciOi...` ou `sb_publishable_...`).
4. Copie esses dois valores.

> ⚠️ **Atenção:** Nunca use a chave `service_role secret` no frontend. Use **apenas** a chave pública `anon public`.

---

## 📝 PASSO 3: EXECUTAR O SCRIPT SQL (CRIAR AS 9 TABELAS)

O sistema RadBio precisa de 9 tabelas acadêmicas no banco de dados. Para criá-las automaticamente:

1. No menu lateral esquerdo do Supabase, clique no ícone **SQL Editor** (ícone de terminal/código).
2. Clique em **"New Query"** (Nova Consulta).
3. Abra o arquivo **`supabase_schema.sql`** deste projeto (ou clique em **"Script SQL"** no painel do sistema RadBio) e copie todo o conteúdo.
4. Cole o script inteiro na tela do SQL Editor do Supabase.
5. Clique no botão verde **RUN** (no canto inferior direito do editor do Supabase).
6. Você verá a mensagem: `Success. No rows returned`.

As seguintes 9 tabelas e políticas RLS serão criadas instantaneamente:
- `radbio_users` (Alunos, Professores e Administradores)
- `radbio_courses` (Cursos de Graduação e Especialização)
- `radbio_cursos_livres` (Cursos de 40 Horas MEC)
- `radbio_lessons` (Aulas gravadas e simuladores de TC)
- `radbio_tasks` (Trabalhos, Casos DICOM e Entregas)
- `radbio_grades` (Boletim com N1, N2, Prática e Média)
- `radbio_certificates` (Certificados e Diplomas emitidos)
- `radbio_notifications` (Avisos acadêmicos e e-mails)
- `radbio_payments` (Matrículas e transações PIX)

---

## ⚡ PASSO 4: CONECTAR NO SISTEMA RADBIO

1. No sistema RadBio, clique no menu lateral em **"Banco Supabase & Ajustes"** (ou no botão superior **"Conectar Supabase"**).
2. No **Passo 1 (Credenciais do Projeto)**:
   - Cole sua **Project URL**.
   - Cole sua **Chave Anon**.
   - Clique em **"Salvar Credenciais"**.
3. No **Passo 3 (Testar & Sincronizar)**:
   - Clique em **"Testar Conexão Supabase"**.
   - Você verá o status verde: `✓ Conexão com o Supabase ativa e 100% operacional!`
   - Clique em **"Enviar Dados (Push)"** para carregar os alunos, cursos e notas iniciais para o seu banco do Supabase!

---

## 🔧 DÚVIDAS E ERROS COMUNS:

| Problema | Causa | Solução |
| :--- | :--- | :--- |
| **"Failed to fetch" ou Erro de Rede** | URL digitada errada ou com espaços/barras extras | Certifique-se de que a URL seja no formato exato `https://xxxx.supabase.co` |
| **"Could not find the table in schema cache" ou PGRST205** | As tabelas ainda não foram criadas | Execute o script `supabase_schema.sql` no SQL Editor do Supabase (Passo 3) |
| **"Falha de autenticação (HTTP 401/403)"** | Chave Anon incorreta | Copie a chave `anon public` na aba Project Settings > API do Supabase |
| **Projeto pausado no Supabase** | Projetos gratuitos pausam após dias sem uso | Acesse o painel do Supabase e clique em "Restore Project" |

---
Pronto! Com isso o sistema estará 100% integrado ao Supabase!

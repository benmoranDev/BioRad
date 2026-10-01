-- =========================================================================
-- BANCO DE DADOS SUPABASE - SISTEMA RADBIO (ENSINO EM TOMOGRAFIA & CURSOS)
-- Execute este script no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =========================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Usuários Acadêmicos
CREATE TABLE IF NOT EXISTS public.radbio_users (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Cursos Regulares da Graduação/Especialização
CREATE TABLE IF NOT EXISTS public.radbio_courses (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Cursos Livres de 40 Horas (Certificação MEC / Lei 9.394/96)
CREATE TABLE IF NOT EXISTS public.radbio_cursos_livres (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Videoaulas, Vídeos do Simulador e Módulos
CREATE TABLE IF NOT EXISTS public.radbio_lessons (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Tarefas e Entregas de Casos DICOM
CREATE TABLE IF NOT EXISTS public.radbio_tasks (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de Notas e Boletim Acadêmico (N1, N2, Prática e Média)
CREATE TABLE IF NOT EXISTS public.radbio_grades (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabela de Certificados Oficiais (Validação QR e Hash Criptográfico)
CREATE TABLE IF NOT EXISTS public.radbio_certificates (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabela de Notificações e Mensagens Acadêmicas
CREATE TABLE IF NOT EXISTS public.radbio_notifications (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Tabela de Pagamentos e Matrículas em Cursos Livres (PIX / Cartão)
CREATE TABLE IF NOT EXISTS public.radbio_payments (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_radbio_users_email ON public.radbio_users USING btree ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_radbio_users_role ON public.radbio_users USING btree ((data->>'role'));
CREATE INDEX IF NOT EXISTS idx_radbio_grades_student_id ON public.radbio_grades USING btree ((data->>'studentId'));
CREATE INDEX IF NOT EXISTS idx_radbio_certificates_code ON public.radbio_certificates USING btree ((data->>'code'));
CREATE INDEX IF NOT EXISTS idx_radbio_payments_code ON public.radbio_payments USING btree ((data->>'transactionCode'));

-- Conceder permissões para os papéis da API Supabase (anon e authenticated)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

-- Habilitar RLS
ALTER TABLE public.radbio_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_cursos_livres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.radbio_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público para o client do sistema
DO $$
BEGIN
    DROP POLICY IF EXISTS "Acesso público radbio_users" ON public.radbio_users;
    CREATE POLICY "Acesso público radbio_users" ON public.radbio_users FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_courses" ON public.radbio_courses;
    CREATE POLICY "Acesso público radbio_courses" ON public.radbio_courses FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_cursos_livres" ON public.radbio_cursos_livres;
    CREATE POLICY "Acesso público radbio_cursos_livres" ON public.radbio_cursos_livres FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_lessons" ON public.radbio_lessons;
    CREATE POLICY "Acesso público radbio_lessons" ON public.radbio_lessons FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_tasks" ON public.radbio_tasks;
    CREATE POLICY "Acesso público radbio_tasks" ON public.radbio_tasks FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_grades" ON public.radbio_grades;
    CREATE POLICY "Acesso público radbio_grades" ON public.radbio_grades FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_certificates" ON public.radbio_certificates;
    CREATE POLICY "Acesso público radbio_certificates" ON public.radbio_certificates FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_notifications" ON public.radbio_notifications;
    CREATE POLICY "Acesso público radbio_notifications" ON public.radbio_notifications FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Acesso público radbio_payments" ON public.radbio_payments;
    CREATE POLICY "Acesso público radbio_payments" ON public.radbio_payments FOR ALL USING (true) WITH CHECK (true);
END $$;

-- Habilitar Realtime de forma idempotente e segura
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'radbio_notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.radbio_notifications;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'radbio_grades'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.radbio_grades;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'radbio_certificates'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.radbio_certificates;
        END IF;

        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'radbio_payments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.radbio_payments;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

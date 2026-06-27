-- ========================================================
-- BOM PASTOR DIGITAL — MÓDULO PALESTRANTES (v5.3)
-- Migração: Tabelas, Índices, RLS e Storage
-- ========================================================

-- =====================
-- 1. TABELA: palestrantes (entidade global)
-- =====================
CREATE TABLE IF NOT EXISTS palestrantes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    bio TEXT,
    foto_url TEXT,
    -- Redes sociais (campos fixos)
    instagram VARCHAR(255),
    linkedin VARCHAR(255),
    twitter VARCHAR(255),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE palestrantes IS 'Cadastro global de palestrantes. Um palestrante pode participar de atividades em múltiplos eventos.';

-- =====================
-- 2. TABELA DE JUNÇÃO: atividade_palestrantes (N:N)
-- =====================
CREATE TABLE IF NOT EXISTS atividade_palestrantes (
    id SERIAL PRIMARY KEY,
    atividade_id UUID NOT NULL REFERENCES atividades(id) ON DELETE CASCADE,
    palestrante_id INTEGER NOT NULL REFERENCES palestrantes(id) ON DELETE CASCADE,
    tipo_participacao VARCHAR(50) NOT NULL DEFAULT 'principal'
        CHECK (tipo_participacao IN ('principal', 'painelista', 'mediador')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Evitar duplicação: mesmo palestrante não pode ser vinculado 2x na mesma atividade
    CONSTRAINT unique_atividade_palestrante UNIQUE (atividade_id, palestrante_id)
);

COMMENT ON TABLE atividade_palestrantes IS 'Vínculo N:N entre atividades do cronograma e palestrantes, com tipo de participação.';

-- =====================
-- 3. ÍNDICES DE PERFORMANCE
-- =====================
CREATE INDEX IF NOT EXISTS idx_palestrantes_nome ON palestrantes(nome);
CREATE INDEX IF NOT EXISTS idx_atv_pal_atividade ON atividade_palestrantes(atividade_id);
CREATE INDEX IF NOT EXISTS idx_atv_pal_palestrante ON atividade_palestrantes(palestrante_id);

-- =====================
-- 4. GARANTIR COLUNA descricao EM atividades
-- =====================
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS descricao TEXT;

-- =====================
-- 5. REMOVER CONSTRAINT FIXA DE CATEGORIA (agora usa categorias dinâmicas do banco)
-- =====================
ALTER TABLE atividades DROP CONSTRAINT IF EXISTS atividades_categoria_check;

-- =====================
-- 6. ROW LEVEL SECURITY (RLS)
-- =====================

-- Habilitar RLS
ALTER TABLE palestrantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividade_palestrantes ENABLE ROW LEVEL SECURITY;

-- PALESTRANTES: Leitura pública (palestrantes aparecem na agenda pública)
CREATE POLICY "palestrantes_select_anon"
    ON palestrantes FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "palestrantes_select_authenticated"
    ON palestrantes FOR SELECT
    TO authenticated
    USING (true);

-- PALESTRANTES: Escrita apenas para admins
CREATE POLICY "palestrantes_insert_admin"
    ON palestrantes FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "palestrantes_update_admin"
    ON palestrantes FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "palestrantes_delete_admin"
    ON palestrantes FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- ATIVIDADE_PALESTRANTES: Leitura pública
CREATE POLICY "atv_pal_select_anon"
    ON atividade_palestrantes FOR SELECT
    TO anon
    USING (true);

CREATE POLICY "atv_pal_select_authenticated"
    ON atividade_palestrantes FOR SELECT
    TO authenticated
    USING (true);

-- ATIVIDADE_PALESTRANTES: Escrita apenas para admins
CREATE POLICY "atv_pal_insert_admin"
    ON atividade_palestrantes FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "atv_pal_update_admin"
    ON atividade_palestrantes FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "atv_pal_delete_admin"
    ON atividade_palestrantes FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================
-- 7. STORAGE BUCKET PARA FOTOS DE PALESTRANTES
-- =====================
-- NOTA: Este comando deve ser executado via SQL Editor do Supabase.
-- Se o bucket já existir, o INSERT será ignorado.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'palestrantes',
    'palestrantes',
    true,
    2097152,  -- 2MB máximo
    ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Política: qualquer um pode ler as fotos (públicas)
CREATE POLICY "palestrantes_fotos_select"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'palestrantes');

-- Política: apenas admins podem fazer upload/deletar fotos
CREATE POLICY "palestrantes_fotos_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'palestrantes'
        AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "palestrantes_fotos_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'palestrantes'
        AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "palestrantes_fotos_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'palestrantes'
        AND (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- ========================================================
-- FIM DO SCRIPT
-- Execute este script no SQL Editor do Supabase Dashboard.
-- ========================================================

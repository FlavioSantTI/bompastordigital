-- ========================================================
-- BOM PASTOR DIGITAL — MÓDULO CRONOGRAMA (v4.0)
-- Schema para Salas e Atividades do Evento
-- ========================================================

-- =====================
-- 1. TABELA: SALAS
-- =====================
CREATE TABLE IF NOT EXISTS salas (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    capacidade INTEGER,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Uma sala não pode ter nome duplicado dentro do mesmo evento
    CONSTRAINT unique_sala_evento UNIQUE (evento_id, nome)
);

COMMENT ON TABLE salas IS 'Salas/espaços disponíveis para atividades de cada evento.';

-- =====================
-- 2. TABELA: ATIVIDADES
-- =====================
CREATE TABLE IF NOT EXISTS atividades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    sala_id INTEGER NOT NULL REFERENCES salas(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    palestrante VARCHAR(255),
    categoria VARCHAR(50) NOT NULL DEFAULT 'outros'
        CHECK (categoria IN ('palestra', 'workshop', 'intervalo', 'cerimonia', 'outros')),
    data DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fim TIME NOT NULL,
    publicado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Hora de término deve ser posterior à hora de início
    CONSTRAINT check_horario_valido CHECK (hora_fim > hora_inicio)
);

COMMENT ON TABLE atividades IS 'Atividades da grade de cronograma de cada evento.';

-- =====================
-- 3. ÍNDICES DE PERFORMANCE
-- =====================
CREATE INDEX IF NOT EXISTS idx_salas_evento ON salas(evento_id);
CREATE INDEX IF NOT EXISTS idx_atividades_evento_data ON atividades(evento_id, data);
CREATE INDEX IF NOT EXISTS idx_atividades_sala ON atividades(sala_id);
CREATE INDEX IF NOT EXISTS idx_atividades_publicado ON atividades(publicado) WHERE publicado = true;

-- =====================
-- 4. ROW LEVEL SECURITY (RLS)
-- =====================

-- Habilitar RLS nas tabelas
ALTER TABLE salas ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividades ENABLE ROW LEVEL SECURITY;

-- SALAS: Leitura para todos autenticados
CREATE POLICY "salas_select_authenticated"
    ON salas FOR SELECT
    TO authenticated
    USING (true);

-- SALAS: Leitura pública (para timeline do participante sem login)
CREATE POLICY "salas_select_anon"
    ON salas FOR SELECT
    TO anon
    USING (true);

-- SALAS: Inserção/Atualização/Deleção apenas para admins
CREATE POLICY "salas_insert_admin"
    ON salas FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "salas_update_admin"
    ON salas FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "salas_delete_admin"
    ON salas FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- ATIVIDADES: Leitura para todos autenticados
CREATE POLICY "atividades_select_authenticated"
    ON atividades FOR SELECT
    TO authenticated
    USING (true);

-- ATIVIDADES: Leitura pública (para timeline sem login, apenas publicadas)
CREATE POLICY "atividades_select_anon"
    ON atividades FOR SELECT
    TO anon
    USING (publicado = true);

-- ATIVIDADES: Inserção/Atualização/Deleção apenas para admins
CREATE POLICY "atividades_insert_admin"
    ON atividades FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "atividades_update_admin"
    ON atividades FOR UPDATE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

CREATE POLICY "atividades_delete_admin"
    ON atividades FOR DELETE
    TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

-- =====================
-- FIM DO SCRIPT
-- =====================
-- Execute este script no SQL Editor do Supabase Dashboard.
-- Após a execução, as tabelas estarão disponíveis para uso no frontend.

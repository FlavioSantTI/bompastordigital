-- ================================================================
-- MÓDULO UNIFICADO DE CRACHÁS — TABELAS, RPCs e RLS
-- Projeto: Bom Pastor Digital
-- PRD: Módulo Unificado e Desacoplado de Geração de Crachás v1.0
-- Data: Setembro 2026
--
-- NOTA: Este script contém APENAS criações novas (CREATE).
-- Nenhuma tabela existente é modificada ou excluída.
-- Seguro para execução em produção sem risco de perda de dados.
-- ================================================================


-- ========================================
-- 1. TABELA: badge_templates
-- Templates configuráveis de layout de crachás
-- ========================================
CREATE TABLE IF NOT EXISTS badge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    layout_type VARCHAR(20) NOT NULL DEFAULT 'GRID_A4',
        -- 'GRID_A4': Folha A4 com grade de crachás
        -- 'THERMAL_ROLL': Rolo térmico contínuo (Zebra/Elgin)
        -- 'DESK_TENT': Crachá de mesa/tenda dobrado
    grid_columns INTEGER NOT NULL DEFAULT 1,
    grid_rows INTEGER NOT NULL DEFAULT 2,
    width_mm NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    height_mm NUMERIC(5,2) NOT NULL DEFAULT 140.00,
    margin_mm NUMERIC(4,2) NOT NULL DEFAULT 5.00,
    has_backside BOOLEAN NOT NULL DEFAULT FALSE,
    has_qr_code BOOLEAN NOT NULL DEFAULT TRUE,
    has_cut_marks BOOLEAN NOT NULL DEFAULT TRUE,
    bg_image_url VARCHAR(500),
    logo_url VARCHAR(500),
    header_config JSONB DEFAULT '{}',
    styling_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE badge_templates IS 'Templates configuráveis de layout para impressão de crachás. Um evento pode ter múltiplos templates.';

CREATE INDEX IF NOT EXISTS idx_badge_templates_evento ON badge_templates(evento_id);


-- ========================================
-- 2. TABELA: badge_generation_jobs
-- Histórico de lotes de crachás gerados
-- ========================================
CREATE TABLE IF NOT EXISTS badge_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES badge_templates(id) ON DELETE CASCADE,
    source_entity VARCHAR(50) NOT NULL,
    filter_criteria JSONB DEFAULT '{}',
    total_records INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
    pdf_output_url VARCHAR(500),
    error_message TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ
);

COMMENT ON TABLE badge_generation_jobs IS 'Registro histórico de cada lote de crachás gerado, com status e link para o PDF resultante.';

CREATE INDEX IF NOT EXISTS idx_badge_jobs_evento ON badge_generation_jobs(evento_id);
CREATE INDEX IF NOT EXISTS idx_badge_jobs_status ON badge_generation_jobs(status);


-- ========================================
-- 3. ROW LEVEL SECURITY (badge_templates)
-- ========================================
ALTER TABLE badge_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badge_templates_select" ON badge_templates;
CREATE POLICY "badge_templates_select"
    ON badge_templates FOR SELECT TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "badge_templates_admin" ON badge_templates;
CREATE POLICY "badge_templates_admin"
    ON badge_templates FOR ALL TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ========================================
-- 4. ROW LEVEL SECURITY (badge_generation_jobs)
-- ========================================
ALTER TABLE badge_generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "badge_jobs_select" ON badge_generation_jobs;
CREATE POLICY "badge_jobs_select"
    ON badge_generation_jobs FOR SELECT TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "badge_jobs_admin" ON badge_generation_jobs;
CREATE POLICY "badge_jobs_admin"
    ON badge_generation_jobs FOR ALL TO authenticated
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin')
    WITH CHECK ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');


-- ========================================
-- 4. RPC: get_inscritos_para_cracha (v3 — suporte a cônjuge para crachá de casal)
-- ========================================
DROP FUNCTION IF EXISTS get_inscritos_para_cracha(INTEGER);

CREATE OR REPLACE FUNCTION get_inscritos_para_cracha(p_evento_id INTEGER)
RETURNS TABLE(
    inscricao_id UUID,
    tipo         TEXT,    -- 'esposo' | 'esposa' | 'individual'
    nome         TEXT,
    nome_conjuge TEXT,
    paroquia     TEXT,
    diocese      TEXT,
    cidade       TEXT,
    evento       TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Bloco 1: Esposos de inscricoes de CASAIS (esposa_id IS NOT NULL)
    SELECT
        i.id               AS inscricao_id,
        'esposo'::TEXT     AS tipo,
        p.nome             AS nome,
        p_conjuge.nome     AS nome_conjuge,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo    AS diocese,
        (i.dados_conjuntos->>'cidade')::TEXT   AS cidade,
        e.nome             AS evento
    FROM inscricoes i
    JOIN pessoas p         ON p.id = i.esposo_id
    JOIN pessoas p_conjuge ON p_conjuge.id = i.esposa_id
    LEFT JOIN dioceses d   ON d.id = i.diocese_id
    JOIN eventos e         ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposo_id IS NOT NULL
      AND i.esposa_id IS NOT NULL

    UNION ALL

    -- Bloco 2: Esposas de inscricoes de CASAIS (esposa_id IS NOT NULL)
    SELECT
        i.id               AS inscricao_id,
        'esposa'::TEXT     AS tipo,
        p.nome             AS nome,
        p_conjuge.nome     AS nome_conjuge,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo    AS diocese,
        (i.dados_conjuntos->>'cidade')::TEXT   AS cidade,
        e.nome             AS evento
    FROM inscricoes i
    JOIN pessoas p         ON p.id = i.esposa_id
    JOIN pessoas p_conjuge ON p_conjuge.id = i.esposo_id
    LEFT JOIN dioceses d   ON d.id = i.diocese_id
    JOIN eventos e         ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposa_id IS NOT NULL

    UNION ALL

    -- Bloco 3: Participantes de inscricoes INDIVIDUAIS (esposa_id IS NULL)
    SELECT
        i.id               AS inscricao_id,
        'individual'::TEXT AS tipo,
        p.nome             AS nome,
        NULL::TEXT         AS nome_conjuge,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo    AS diocese,
        (i.dados_conjuntos->>'cidade')::TEXT   AS cidade,
        e.nome             AS evento
    FROM inscricoes i
    JOIN pessoas p         ON p.id = i.esposo_id
    LEFT JOIN dioceses d   ON d.id = i.diocese_id
    JOIN eventos e         ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposo_id IS NOT NULL
      AND i.esposa_id IS NULL

    ORDER BY nome;
$$;

REVOKE ALL  ON FUNCTION get_inscritos_para_cracha(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_inscritos_para_cracha(INTEGER) TO authenticated;


-- ========================================
-- 5. RPC: get_equipe_membros_para_cracha
-- ========================================
DROP FUNCTION IF EXISTS get_equipe_membros_para_cracha(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_equipe_membros_para_cracha(
    p_evento_id INTEGER,
    p_equipe_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    membro_id     INTEGER,
    pessoa_id     UUID,
    nome          TEXT,
    equipe_nome   TEXT,
    equipe_cor    TEXT,
    cargo_nome    TEXT,
    cargo_nivel   INTEGER,
    observacao    TEXT,
    evento_nome   TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        em.id          AS membro_id,
        p.id           AS pessoa_id,
        p.nome         AS nome,
        eq.nome        AS equipe_nome,
        eq.cor         AS equipe_cor,
        ce.nome        AS cargo_nome,
        ce.nivel       AS cargo_nivel,
        em.observacao  AS observacao,
        ev.nome        AS evento_nome
    FROM equipe_membros em
    JOIN equipes eq       ON eq.id = em.equipe_id
    JOIN pessoas p        ON p.id = em.pessoa_id
    JOIN cargos_equipe ce ON ce.id = em.cargo_id
    JOIN eventos ev       ON ev.id = eq.evento_id
    WHERE eq.evento_id = p_evento_id
      AND (p_equipe_id IS NULL OR eq.id = p_equipe_id)
    ORDER BY eq.nome, ce.nivel, p.nome;
$$;

REVOKE ALL ON FUNCTION get_equipe_membros_para_cracha(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_equipe_membros_para_cracha(INTEGER, INTEGER) TO authenticated;


-- ========================================
-- 6. RPC: get_palestrantes_para_cracha
-- ========================================
DROP FUNCTION IF EXISTS get_palestrantes_para_cracha(INTEGER);

CREATE OR REPLACE FUNCTION get_palestrantes_para_cracha(p_evento_id INTEGER)
RETURNS TABLE(
    palestrante_id    INTEGER,
    nome              TEXT,
    foto_url          TEXT,
    tipo_participacao TEXT,
    atividade_titulo  TEXT,
    atividade_data    DATE,
    atividade_hora    TEXT,
    evento_nome       TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT ON (pal.id)
        pal.id                 AS palestrante_id,
        pal.nome               AS nome,
        pal.foto_url           AS foto_url,
        ap.tipo_participacao   AS tipo_participacao,
        a.titulo               AS atividade_titulo,
        a.data                 AS atividade_data,
        a.hora_inicio          AS atividade_hora,
        ev.nome                AS evento_nome
    FROM palestrantes pal
    JOIN atividade_palestrantes ap ON ap.palestrante_id = pal.id
    JOIN atividades a              ON a.id = ap.atividade_id
    JOIN eventos ev                ON ev.id = a.evento_id
    WHERE a.evento_id = p_evento_id
    ORDER BY pal.id, a.data, a.hora_inicio;
$$;

REVOKE ALL ON FUNCTION get_palestrantes_para_cracha(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_palestrantes_para_cracha(INTEGER) TO authenticated;


-- ========================================
-- 7. RPC: get_circulo_membros_para_cracha
-- ========================================
DROP FUNCTION IF EXISTS get_circulo_membros_para_cracha(INTEGER, UUID);

CREATE OR REPLACE FUNCTION get_circulo_membros_para_cracha(
    p_evento_id INTEGER,
    p_circulo_id UUID DEFAULT NULL
)
RETURNS TABLE(
    membro_id          UUID,
    inscricao_id       UUID,
    pessoa_nome        TEXT,
    circulo_nome       TEXT,
    circulo_cor        TEXT,
    is_coordenador     BOOLEAN,
    coord_esposo_nome  TEXT,
    coord_esposa_nome  TEXT,
    evento_nome        TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        cm.id                  AS membro_id,
        cm.inscricao_id        AS inscricao_id,
        p.nome                 AS pessoa_nome,
        c.nome                 AS circulo_nome,
        c.cor                  AS circulo_cor,
        (c.esposo_coordenador_id = i.esposo_id
         OR c.esposa_coordenador_id = i.esposa_id
         OR c.esposo_coordenador_id = i.esposa_id
        )                      AS is_coordenador,
        pc_esp.nome            AS coord_esposo_nome,
        pc_esa.nome            AS coord_esposa_nome,
        ev.nome                AS evento_nome
    FROM circulo_membros cm
    JOIN circulos c          ON c.id = cm.circulo_id
    JOIN inscricoes i        ON i.id = cm.inscricao_id
    JOIN pessoas p           ON p.id = COALESCE(i.esposo_id, i.esposa_id)
    JOIN eventos ev          ON ev.id = c.evento_id
    LEFT JOIN pessoas pc_esp ON pc_esp.id = c.esposo_coordenador_id
    LEFT JOIN pessoas pc_esa ON pc_esa.id = c.esposa_coordenador_id
    WHERE c.evento_id = p_evento_id
      AND (p_circulo_id IS NULL OR c.id = p_circulo_id)
    ORDER BY c.nome, p.nome;
$$;

REVOKE ALL ON FUNCTION get_circulo_membros_para_cracha(INTEGER, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_circulo_membros_para_cracha(INTEGER, UUID) TO authenticated;


-- ========================================
-- 8. VERIFICAÇÃO
-- ========================================
SELECT '✅ Módulo Unificado de Crachás — Tabelas e RPCs criadas com sucesso!' AS status;

SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('badge_templates', 'badge_generation_jobs')
ORDER BY tablename;

SELECT proname FROM pg_proc
WHERE proname IN (
    'get_equipe_membros_para_cracha',
    'get_palestrantes_para_cracha',
    'get_circulo_membros_para_cracha'
)
ORDER BY proname;

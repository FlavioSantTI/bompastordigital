-- ==============================================================================
-- RPC: get_inscritos_para_cracha (v3 — suporte a inscricoes individuais e nome do cônjuge)
-- DESCRIÇÃO: Retorna todos os inscritos de um evento com os dados para
-- impressão de crachás. Inclui 'nome_conjuge' para suporte à nomenclatura
-- tradicional de casais no Bom Pastor (ex: "Flavio da Silvia" / "Silvia do Flavio").
-- ==============================================================================

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
      AND i.esposa_id IS NOT NULL   -- <-- somente casais

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
      AND i.esposa_id IS NULL        -- <-- somente individuais

    ORDER BY nome;
$$;

-- Permissões: mantém a mesma política de segurança
REVOKE ALL  ON FUNCTION get_inscritos_para_cracha(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_inscritos_para_cracha(INTEGER) TO authenticated;

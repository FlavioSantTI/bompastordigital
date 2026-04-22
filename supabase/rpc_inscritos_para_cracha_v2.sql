-- ==============================================================================
-- RPC: get_inscritos_para_cracha (v2 — suporte a inscricoes individuais)
-- DESCRIÇÃO: Retorna todos os inscritos de um evento com os dados para
-- impressão de crachás. Agora diferencia 'casal' de 'individual'.
--
-- Mudança em relação à v1:
--   - Inscrições com esposa_id IS NULL retornam tipo = 'individual'
--     em vez de 'esposo', para que o CrachaTemplate possa tratar
--     de forma diferente (layout de página inteira vs meia página).
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_inscritos_para_cracha(p_evento_id INTEGER)
RETURNS TABLE(
    inscricao_id UUID,
    tipo         TEXT,    -- 'esposo' | 'esposa' | 'individual'
    nome         TEXT,
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
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo    AS diocese,
        (i.dados_conjuntos->>'cidade')::TEXT   AS cidade,
        e.nome             AS evento
    FROM inscricoes i
    JOIN pessoas  p ON p.id = i.esposo_id
    LEFT JOIN dioceses d ON d.id = i.diocese_id
    JOIN eventos  e ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposo_id IS NOT NULL
      AND i.esposa_id IS NOT NULL   -- <-- somente casais

    UNION ALL

    -- Bloco 2: Esposas de inscricoes de CASAIS (esposa_id IS NOT NULL)
    SELECT
        i.id               AS inscricao_id,
        'esposa'::TEXT     AS tipo,
        p.nome             AS nome,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo    AS diocese,
        (i.dados_conjuntos->>'cidade')::TEXT   AS cidade,
        e.nome             AS evento
    FROM inscricoes i
    JOIN pessoas  p ON p.id = i.esposa_id
    LEFT JOIN dioceses d ON d.id = i.diocese_id
    JOIN eventos  e ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposa_id IS NOT NULL

    UNION ALL

    -- Bloco 3: Participantes de inscricoes INDIVIDUAIS (esposa_id IS NULL)
    SELECT
        i.id               AS inscricao_id,
        'individual'::TEXT AS tipo,
        p.nome             AS nome,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo    AS diocese,
        (i.dados_conjuntos->>'cidade')::TEXT   AS cidade,
        e.nome             AS evento
    FROM inscricoes i
    JOIN pessoas  p ON p.id = i.esposo_id
    LEFT JOIN dioceses d ON d.id = i.diocese_id
    JOIN eventos  e ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposo_id IS NOT NULL
      AND i.esposa_id IS NULL        -- <-- somente individuais

    ORDER BY nome;
$$;

-- Permissões: mantém a mesma política da v1
REVOKE ALL  ON FUNCTION get_inscritos_para_cracha(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_inscritos_para_cracha(INTEGER) TO authenticated;

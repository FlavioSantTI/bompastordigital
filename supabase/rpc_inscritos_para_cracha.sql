-- ======================================================
-- BOM PASTOR DIGITAL - RPC para Crachás
-- Executa no Supabase SQL Editor
-- ======================================================

-- Retorna todos os inscritos de um evento com os dados
-- necessários para impressão do crachá.
CREATE OR REPLACE FUNCTION get_inscritos_para_cracha(p_evento_id INTEGER)
RETURNS TABLE(
    inscricao_id UUID,
    tipo         TEXT,    -- 'esposo' | 'esposa'
    nome         TEXT,
    paroquia     TEXT,
    diocese      TEXT,
    evento       TEXT     -- Nome do evento para o cabeçalho do crachá
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    -- Esposos
    SELECT
        i.id           AS inscricao_id,
        'esposo'::TEXT AS tipo,
        p.nome         AS nome,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo AS diocese,
        e.nome          AS evento
    FROM inscricoes i
    JOIN pessoas  p ON p.id = i.esposo_id
    LEFT JOIN dioceses d ON d.id = i.diocese_id
    JOIN eventos  e ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposo_id IS NOT NULL

    UNION ALL

    -- Esposas
    SELECT
        i.id           AS inscricao_id,
        'esposa'::TEXT AS tipo,
        p.nome         AS nome,
        (i.dados_conjuntos->>'paroquia')::TEXT AS paroquia,
        d.nome_completo AS diocese,
        e.nome          AS evento
    FROM inscricoes i
    JOIN pessoas  p ON p.id = i.esposa_id
    LEFT JOIN dioceses d ON d.id = i.diocese_id
    JOIN eventos  e ON e.id = i.evento_id
    WHERE i.evento_id = p_evento_id
      AND i.esposa_id IS NOT NULL

    ORDER BY nome;
$$;

-- Garante que apenas admins podem chamar a função
REVOKE ALL ON FUNCTION get_inscritos_para_cracha(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_inscritos_para_cracha(INTEGER) TO authenticated;

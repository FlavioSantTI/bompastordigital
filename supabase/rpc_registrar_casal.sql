-- ==============================================================================
-- PROCEDURE: registrar_casal_ecc
-- DESCRIÇÃO: Registra o marido e a esposa (UPSERT), cria a inscrição do casal no
-- evento e retorna o ID e os dados básicos em um fluxo transacional único.
-- ==============================================================================

CREATE OR REPLACE FUNCTION registrar_casal_ecc(payload JSONB) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER -- Permite burlar RLS de insert nas tabelas para não precisarem estar abertas ao público
AS $$
DECLARE
    v_esposo_id UUID;
    v_esposa_id UUID;
    v_diocese_id INTEGER;
    v_inscricao_id UUID;
    v_evento RECORD;
BEGIN
    -- 1. Validar e inserir Esposo
    INSERT INTO pessoas (cpf, nome, nascimento, email, telefone)
    VALUES (
        payload->'esposo'->>'cpf',
        payload->'esposo'->>'nome',
        (payload->'esposo'->>'nascimento')::DATE,
        payload->'esposo'->>'email',
        payload->'esposo'->>'telefone'
    )
    ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        nascimento = EXCLUDED.nascimento,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone
    RETURNING id INTO v_esposo_id;

    -- 2. Validar e inserir Esposa
    INSERT INTO pessoas (cpf, nome, nascimento, email, telefone)
    VALUES (
        payload->'esposa'->>'cpf',
        payload->'esposa'->>'nome',
        (payload->'esposa'->>'nascimento')::DATE,
        payload->'esposa'->>'email',
        payload->'esposa'->>'telefone'
    )
    ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        nascimento = EXCLUDED.nascimento,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone
    RETURNING id INTO v_esposa_id;

    -- 3. Obter a Diocese com base no Município
    SELECT diocese_id INTO v_diocese_id 
    FROM municipios 
    WHERE codigo_tom = (payload->'contato'->>'municipio_id')::INTEGER;

    -- 4. Inserir a Inscrição (verifica se já não existe antes para este evento)
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (esposo_id IN (v_esposo_id, v_esposa_id) OR esposa_id IN (v_esposo_id, v_esposa_id))
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Um ou ambos os CPFs já estão inscritos neste evento.');
    END IF;

    -- Usa NULLIF para lidar com casos de user_id anônimos/undefined
    INSERT INTO inscricoes (
        evento_id, 
        esposo_id, 
        esposa_id, 
        diocese_id, 
        user_id, 
        dados_conjuntos
    ) VALUES (
        (payload->>'evento_id')::INTEGER,
        v_esposo_id,
        v_esposa_id,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        payload->'dados_conjuntos'
    ) RETURNING id INTO v_inscricao_id;

    -- 5. Carregar os dados do Evento para retorno
    SELECT nome, data_inicio, data_fim INTO v_evento
    FROM eventos
    WHERE id = (payload->>'evento_id')::INTEGER;

    -- Retorno com sucesso
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição realizada com sucesso!',
        'inscricaoId', v_inscricao_id,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.data_inicio,
            'data_fim', v_evento.data_fim
        )
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já existe uma inscrição para este casal neste evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar a inscrição: ' || SQLERRM);
END;
$$;

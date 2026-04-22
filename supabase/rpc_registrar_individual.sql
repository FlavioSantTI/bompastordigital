-- ==============================================================================
-- FUNCTION: registrar_individual_ecc
-- DESCRIÇÃO: Registra uma inscrição individual (uma única pessoa) no evento.
-- ==============================================================================

CREATE OR REPLACE FUNCTION registrar_individual_ecc(payload JSONB) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pessoa_id UUID;
    v_diocese_id INTEGER;
    v_inscricao_id UUID;
    v_evento RECORD;
BEGIN
    -- 1. Validar e inserir Participante
    INSERT INTO pessoas (cpf, nome, nascimento, email, telefone)
    VALUES (
        payload->'participante'->>'cpf',
        payload->'participante'->>'nome',
        (payload->'participante'->>'nascimento')::DATE,
        payload->'participante'->>'email',
        payload->'participante'->>'telefone'
    )
    ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        nascimento = EXCLUDED.nascimento,
        email = EXCLUDED.email,
        telefone = EXCLUDED.telefone
    RETURNING id INTO v_pessoa_id;

    -- 2. Obter a Diocese
    v_diocese_id := (payload->'contato'->>'diocese_id')::INTEGER;
    
    IF v_diocese_id IS NULL THEN
        SELECT diocese_id INTO v_diocese_id 
        FROM municipios 
        WHERE codigo_tom = (payload->'contato'->>'municipio_id')::INTEGER;
    END IF;

    -- 3. Verificar se já está inscrito neste evento
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (esposo_id = v_pessoa_id OR esposa_id = v_pessoa_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este CPF já está inscrito neste evento.');
    END IF;

    -- 4. Inserir a Inscrição Individual (usa esposo_id para a pessoa, esposa_id fica NULL)
    INSERT INTO inscricoes (
        evento_id, 
        esposo_id, 
        esposa_id,
        diocese_id, 
        user_id, 
        dados_conjuntos,
        tipo
    ) VALUES (
        (payload->>'evento_id')::INTEGER,
        v_pessoa_id,
        NULL,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        COALESCE(payload->'dados_conjuntos', '{}'::JSONB),
        'individual'
    ) RETURNING id INTO v_inscricao_id;

    -- 5. Carregar os dados do Evento para retorno
    SELECT nome, data_inicio, data_fim INTO v_evento
    FROM eventos
    WHERE id = (payload->>'evento_id')::INTEGER;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição individual realizada com sucesso!',
        'inscricaoId', v_inscricao_id,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.data_inicio,
            'data_fim', v_evento.data_fim
        )
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já existe uma inscrição para esta pessoa neste evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar a inscrição: ' || SQLERRM);
END;
$$;

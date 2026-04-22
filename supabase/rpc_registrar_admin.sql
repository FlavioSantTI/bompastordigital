-- ==============================================================================
-- FUNCTION: registrar_inscricao_admin
-- DESCRIÇÃO: Registra uma inscrição pelo admin com validação mínima.
--            Aceita tipo 'casal' ou 'individual'.
--            Campos obrigatórios: apenas CPF, nome, nascimento da(s) pessoa(s)
--            e dados_conjuntos (pode ser {}).
-- ==============================================================================

CREATE OR REPLACE FUNCTION registrar_inscricao_admin(payload JSONB) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pessoa1_id UUID;
    v_pessoa2_id UUID;
    v_inscricao_id UUID;
    v_tipo VARCHAR(20);
    v_evento RECORD;
BEGIN
    v_tipo := COALESCE(payload->>'tipo', 'casal');

    -- 1. Inserir Pessoa 1 (sempre presente)
    INSERT INTO pessoas (cpf, nome, nascimento, email, telefone)
    VALUES (
        payload->'pessoa1'->>'cpf',
        payload->'pessoa1'->>'nome',
        (payload->'pessoa1'->>'nascimento')::DATE,
        NULLIF(payload->'pessoa1'->>'email', ''),
        NULLIF(payload->'pessoa1'->>'telefone', '')
    )
    ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        nascimento = EXCLUDED.nascimento,
        email = COALESCE(EXCLUDED.email, pessoas.email),
        telefone = COALESCE(EXCLUDED.telefone, pessoas.telefone)
    RETURNING id INTO v_pessoa1_id;

    -- 2. Inserir Pessoa 2 (apenas se casal)
    IF v_tipo = 'casal' AND payload->'pessoa2' IS NOT NULL 
       AND payload->'pessoa2'->>'cpf' IS NOT NULL 
       AND payload->'pessoa2'->>'cpf' != '' THEN
        INSERT INTO pessoas (cpf, nome, nascimento, email, telefone)
        VALUES (
            payload->'pessoa2'->>'cpf',
            payload->'pessoa2'->>'nome',
            (payload->'pessoa2'->>'nascimento')::DATE,
            NULLIF(payload->'pessoa2'->>'email', ''),
            NULLIF(payload->'pessoa2'->>'telefone', '')
        )
        ON CONFLICT (cpf) DO UPDATE SET
            nome = EXCLUDED.nome,
            nascimento = EXCLUDED.nascimento,
            email = COALESCE(EXCLUDED.email, pessoas.email),
            telefone = COALESCE(EXCLUDED.telefone, pessoas.telefone)
        RETURNING id INTO v_pessoa2_id;
    END IF;

    -- 3. Verificar duplicidade no evento
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (
            esposo_id = v_pessoa1_id OR esposa_id = v_pessoa1_id
            OR (v_pessoa2_id IS NOT NULL AND (esposo_id = v_pessoa2_id OR esposa_id = v_pessoa2_id))
          )
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Um ou mais CPFs já estão inscritos neste evento.');
    END IF;

    -- 4. Inserir Inscrição
    INSERT INTO inscricoes (
        evento_id, 
        esposo_id, 
        esposa_id, 
        diocese_id, 
        dados_conjuntos,
        tipo,
        status
    ) VALUES (
        NULLIF((payload->>'evento_id'), '')::INTEGER,
        v_pessoa1_id,
        v_pessoa2_id,
        NULLIF((payload->>'diocese_id'), '')::INTEGER,
        COALESCE(payload->'dados_conjuntos', '{}'::JSONB),
        v_tipo,
        COALESCE(payload->>'status', 'pendente')
    ) RETURNING id INTO v_inscricao_id;

    -- 5. Carregar evento para retorno (apenas se informado)
    IF (payload->>'evento_id') IS NOT NULL AND (payload->>'evento_id') != '' THEN
        SELECT nome, data_inicio, data_fim INTO v_evento
        FROM eventos
        WHERE id = (payload->>'evento_id')::INTEGER;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição registrada pelo admin com sucesso!',
        'inscricaoId', v_inscricao_id,
        'tipo', v_tipo,
        'evento', CASE 
            WHEN (payload->>'evento_id') IS NOT NULL AND (payload->>'evento_id') != '' THEN
                jsonb_build_object(
                    'nome', v_evento.nome,
                    'data_inicio', v_evento.data_inicio,
                    'data_fim', v_evento.data_fim
                )
            ELSE NULL
        END
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já existe uma inscrição duplicada para este evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar: ' || SQLERRM);
END;
$$;

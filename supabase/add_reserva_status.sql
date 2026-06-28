-- ==============================================================================
-- MIGRAÇÃO: ADICIONAR SUPORTE A CADASTRO DE RESERVA (LISTA DE ESPERA)
-- DESCRIÇÃO: Atualiza as RPCs de registro para checar a quantidade de vagas do evento.
-- Quando o limite for atingido, a inscrição é criada com status 'reserva'.
-- ==============================================================================

-- 1. RPC REGISTRAR CASAL (ATUALIZADA COM CADASTRO DE RESERVA)
CREATE OR REPLACE FUNCTION registrar_casal_ecc(payload JSONB) 
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_esposo_id UUID;
    v_esposa_id UUID;
    v_diocese_id INTEGER;
    v_inscricao_id UUID;
    v_evento RECORD;
    v_status VARCHAR(20);
    v_payment_method VARCHAR(50);
    v_vagas INTEGER;
    v_total_inscritos INTEGER;
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

    -- 3. Obter a Diocese
    v_diocese_id := (payload->'contato'->>'diocese_id')::INTEGER;
    IF v_diocese_id IS NULL THEN
        SELECT diocese_id INTO v_diocese_id 
        FROM municipios 
        WHERE codigo_tom = (payload->'contato'->>'municipio_id')::INTEGER;
    END IF;

    -- 4. Verificar duplicidade
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (esposo_id IN (v_esposo_id, v_esposa_id) OR esposa_id IN (v_esposo_id, v_esposa_id))
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Um ou ambos os CPFs já estão inscritos neste evento.');
    END IF;

    -- 4b. Checar Vagas e Determinar Status / Pagamento
    SELECT vagas, is_paid INTO v_vagas, v_evento.is_paid
    FROM eventos WHERE id = (payload->>'evento_id')::INTEGER;

    SELECT COUNT(*) INTO v_total_inscritos 
    FROM inscricoes 
    WHERE evento_id = (payload->>'evento_id')::INTEGER AND status != 'cancelada';

    IF v_vagas IS NOT NULL AND v_total_inscritos >= v_vagas THEN
        v_status := 'reserva';
        v_payment_method := NULL;
    ELSE
        IF v_evento.is_paid THEN
            v_status := 'pendente';
            v_payment_method := 'pix';
        ELSE
            v_status := 'confirmada';
            v_payment_method := NULL;
        END IF;
    END IF;

    -- 4c. Inserir Inscrição
    INSERT INTO inscricoes (
        evento_id, 
        esposo_id, 
        esposa_id, 
        diocese_id, 
        user_id, 
        dados_conjuntos,
        status,
        payment_method_used
    ) VALUES (
        (payload->>'evento_id')::INTEGER,
        v_esposo_id,
        v_esposa_id,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        payload->'dados_conjuntos',
        v_status,
        v_payment_method
    ) RETURNING id INTO v_inscricao_id;

    -- 5. Carregar dados do evento para retorno
    SELECT nome, data_inicio, data_fim INTO v_evento
    FROM eventos
    WHERE id = (payload->>'evento_id')::INTEGER;

    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN v_status = 'reserva' THEN 'Inscrição registrada no Cadastro de Reserva!' ELSE 'Inscrição realizada com sucesso!' END,
        'inscricaoId', v_inscricao_id,
        'status', v_status,
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


-- 2. RPC REGISTRAR INDIVIDUAL (ATUALIZADA COM CADASTRO DE RESERVA)
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
    v_status VARCHAR(20);
    v_payment_method VARCHAR(50);
    v_vagas INTEGER;
    v_total_inscritos INTEGER;
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

    -- 3. Verificar duplicidade
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (esposo_id = v_pessoa_id OR esposa_id = v_pessoa_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este CPF já está inscrito neste evento.');
    END IF;

    -- 3b. Checar Vagas e Determinar Status / Pagamento
    SELECT vagas, is_paid INTO v_vagas, v_evento.is_paid
    FROM eventos WHERE id = (payload->>'evento_id')::INTEGER;

    SELECT COUNT(*) INTO v_total_inscritos 
    FROM inscricoes 
    WHERE evento_id = (payload->>'evento_id')::INTEGER AND status != 'cancelada';

    IF v_vagas IS NOT NULL AND v_total_inscritos >= v_vagas THEN
        v_status := 'reserva';
        v_payment_method := NULL;
    ELSE
        IF v_evento.is_paid THEN
            v_status := 'pendente';
            v_payment_method := 'pix';
        ELSE
            v_status := 'confirmada';
            v_payment_method := NULL;
        END IF;
    END IF;

    -- 4. Inserir a Inscrição Individual
    INSERT INTO inscricoes (
        evento_id, 
        esposo_id, 
        esposa_id, 
        diocese_id, 
        user_id, 
        dados_conjuntos,
        tipo,
        status,
        payment_method_used
    ) VALUES (
        (payload->>'evento_id')::INTEGER,
        v_pessoa_id,
        NULL,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        COALESCE(payload->'dados_conjuntos', '{}'::JSONB),
        'individual',
        v_status,
        v_payment_method
    ) RETURNING id INTO v_inscricao_id;

    -- 5. Carregar dados do evento para retorno
    SELECT nome, data_inicio, data_fim INTO v_evento
    FROM eventos
    WHERE id = (payload->>'evento_id')::INTEGER;

    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN v_status = 'reserva' THEN 'Inscrição registrada no Cadastro de Reserva!' ELSE 'Inscrição realizada com sucesso!' END,
        'inscricaoId', v_inscricao_id,
        'status', v_status,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.data_inicio,
            'data_fim', v_evento.data_fim
        )
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este CPF já está inscrito neste evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar a inscrição: ' || SQLERRM);
END;
$$;

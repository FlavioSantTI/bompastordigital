-- ==============================================================================
-- FIX: Retornar campos de pagamento nas RPCs de registro público
-- PROBLEMA: registrar_casal_ecc e registrar_individual_ecc não retornavam
--           is_paid, event_price, pix_key, pix_key_type, merchant_name,
--           merchant_city — fazendo a tela de confirmação ignorar o PIX.
-- DATA: 2026-07-30
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ registrar_casal_ecc — COM campos de pagamento no retorno                   ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

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
    v_vagas_restantes INTEGER;
BEGIN
    -- 0. Carregar dados completos do evento (incluindo campos de pagamento)
    SELECT INTO v_evento
        id, nome, realizacao_inicio, realizacao_fim,
        inscricao_inicio, inscricao_fim, publicado, status_manual,
        vagas, is_paid, event_price, pix_key, pix_key_type,
        merchant_name, merchant_city
    FROM eventos
    WHERE id = (payload->>'evento_id')::INTEGER;

    IF v_evento.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Evento não encontrado.');
    END IF;

    IF v_evento.publicado = false THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este evento não está disponível para inscrições.');
    END IF;

    IF v_evento.status_manual = 'cancelado' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este evento foi cancelado.');
    END IF;

    IF NOW() < v_evento.inscricao_inicio THEN
        RETURN jsonb_build_object('success', false, 'message', 'As inscrições para este evento ainda não foram abertas.');
    END IF;

    IF NOW() >= v_evento.inscricao_fim THEN
        RETURN jsonb_build_object('success', false, 'message', 'O período de inscrição para este evento já foi encerrado.');
    END IF;

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

    -- 4b. Determinar status e método de pagamento
    v_status := CASE WHEN v_evento.is_paid THEN 'pendente' ELSE 'confirmada' END;
    v_payment_method := CASE WHEN v_evento.is_paid THEN 'pix' ELSE NULL END;

    -- 4c. Verificar vagas (se houver limite)
    IF v_evento.vagas IS NOT NULL THEN
        SELECT v_evento.vagas - COUNT(*) INTO v_vagas_restantes
        FROM inscricoes
        WHERE evento_id = v_evento.id
          AND status NOT IN ('cancelada');
        
        IF v_vagas_restantes <= 0 THEN
            -- Cadastro de Reserva
            INSERT INTO inscricoes (
                evento_id, esposo_id, esposa_id, diocese_id, user_id,
                dados_conjuntos, status, payment_method_used
            ) VALUES (
                v_evento.id,
                v_esposo_id,
                v_esposa_id,
                v_diocese_id,
                NULLIF((payload->>'user_id'), '')::UUID,
                payload->'dados_conjuntos',
                'reserva',
                NULL
            ) RETURNING id INTO v_inscricao_id;

            RETURN jsonb_build_object(
                'success', true,
                'message', 'Inscrição realizada na lista de espera!',
                'inscricaoId', v_inscricao_id,
                'status', 'reserva',
                'evento', jsonb_build_object(
                    'nome', v_evento.nome,
                    'data_inicio', v_evento.realizacao_inicio,
                    'data_fim', v_evento.realizacao_fim,
                    'is_paid', v_evento.is_paid,
                    'event_price', v_evento.event_price,
                    'pix_key', v_evento.pix_key,
                    'pix_key_type', v_evento.pix_key_type,
                    'merchant_name', v_evento.merchant_name,
                    'merchant_city', v_evento.merchant_city
                )
            );
        END IF;
    END IF;

    -- 5. Inserir a Inscrição
    INSERT INTO inscricoes (
        evento_id, esposo_id, esposa_id, diocese_id, user_id,
        dados_conjuntos, status, payment_method_used
    ) VALUES (
        v_evento.id,
        v_esposo_id,
        v_esposa_id,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        payload->'dados_conjuntos',
        v_status,
        v_payment_method
    ) RETURNING id INTO v_inscricao_id;

    -- 6. Retorno com campos de pagamento
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição realizada com sucesso!',
        'inscricaoId', v_inscricao_id,
        'status', v_status,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.realizacao_inicio,
            'data_fim', v_evento.realizacao_fim,
            'is_paid', v_evento.is_paid,
            'event_price', v_evento.event_price,
            'pix_key', v_evento.pix_key,
            'pix_key_type', v_evento.pix_key_type,
            'merchant_name', v_evento.merchant_name,
            'merchant_city', v_evento.merchant_city
        )
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já existe uma inscrição para este casal neste evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar a inscrição: ' || SQLERRM);
END;
$$;


-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ registrar_individual_ecc — COM campos de pagamento no retorno              ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

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
    v_vagas_restantes INTEGER;
BEGIN
    -- 0. Carregar dados completos do evento (incluindo campos de pagamento)
    SELECT INTO v_evento
        id, nome, realizacao_inicio, realizacao_fim,
        inscricao_inicio, inscricao_fim, publicado, status_manual,
        vagas, is_paid, event_price, pix_key, pix_key_type,
        merchant_name, merchant_city
    FROM eventos
    WHERE id = (payload->>'evento_id')::INTEGER;

    IF v_evento.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Evento não encontrado.');
    END IF;

    IF v_evento.publicado = false THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este evento não está disponível para inscrições.');
    END IF;

    IF v_evento.status_manual = 'cancelado' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este evento foi cancelado.');
    END IF;

    IF NOW() < v_evento.inscricao_inicio THEN
        RETURN jsonb_build_object('success', false, 'message', 'As inscrições para este evento ainda não foram abertas.');
    END IF;

    IF NOW() >= v_evento.inscricao_fim THEN
        RETURN jsonb_build_object('success', false, 'message', 'O período de inscrição para este evento já foi encerrado.');
    END IF;

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

    -- 3b. Determinar status e método de pagamento
    v_status := CASE WHEN v_evento.is_paid THEN 'pendente' ELSE 'confirmada' END;
    v_payment_method := CASE WHEN v_evento.is_paid THEN 'pix' ELSE NULL END;

    -- 3c. Verificar vagas (se houver limite)
    IF v_evento.vagas IS NOT NULL THEN
        SELECT v_evento.vagas - COUNT(*) INTO v_vagas_restantes
        FROM inscricoes
        WHERE evento_id = v_evento.id
          AND status NOT IN ('cancelada');
        
        IF v_vagas_restantes <= 0 THEN
            -- Cadastro de Reserva
            INSERT INTO inscricoes (
                evento_id, esposo_id, esposa_id, diocese_id, user_id,
                dados_conjuntos, tipo, status, payment_method_used
            ) VALUES (
                v_evento.id,
                v_pessoa_id,
                NULL,
                v_diocese_id,
                NULLIF((payload->>'user_id'), '')::UUID,
                COALESCE(payload->'dados_conjuntos', '{}'::JSONB),
                'individual',
                'reserva',
                NULL
            ) RETURNING id INTO v_inscricao_id;

            RETURN jsonb_build_object(
                'success', true,
                'message', 'Inscrição realizada na lista de espera!',
                'inscricaoId', v_inscricao_id,
                'status', 'reserva',
                'evento', jsonb_build_object(
                    'nome', v_evento.nome,
                    'data_inicio', v_evento.realizacao_inicio,
                    'data_fim', v_evento.realizacao_fim,
                    'is_paid', v_evento.is_paid,
                    'event_price', v_evento.event_price,
                    'pix_key', v_evento.pix_key,
                    'pix_key_type', v_evento.pix_key_type,
                    'merchant_name', v_evento.merchant_name,
                    'merchant_city', v_evento.merchant_city
                )
            );
        END IF;
    END IF;

    -- 4. Inserir a Inscrição Individual
    INSERT INTO inscricoes (
        evento_id, esposo_id, esposa_id, diocese_id, user_id,
        dados_conjuntos, tipo, status, payment_method_used
    ) VALUES (
        v_evento.id,
        v_pessoa_id,
        NULL,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        COALESCE(payload->'dados_conjuntos', '{}'::JSONB),
        'individual',
        v_status,
        v_payment_method
    ) RETURNING id INTO v_inscricao_id;

    -- 5. Retorno com campos de pagamento
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição individual realizada com sucesso!',
        'inscricaoId', v_inscricao_id,
        'status', v_status,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.realizacao_inicio,
            'data_fim', v_evento.realizacao_fim,
            'is_paid', v_evento.is_paid,
            'event_price', v_evento.event_price,
            'pix_key', v_evento.pix_key,
            'pix_key_type', v_evento.pix_key_type,
            'merchant_name', v_evento.merchant_name,
            'merchant_city', v_evento.merchant_city
        )
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já existe uma inscrição para esta pessoa neste evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar a inscrição: ' || SQLERRM);
END;
$$;

SELECT '✅ RPCs atualizadas com campos de pagamento PIX!' AS resultado;

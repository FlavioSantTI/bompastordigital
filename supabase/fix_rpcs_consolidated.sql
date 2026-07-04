-- ==============================================================================
-- MIGRAÇÃO CONSOLIDADA: RPCs de Registro Corrigidas
-- Bom Pastor Digital v6.0
-- Data: 04/07/2026
--
-- CORRIGE:
--   1. Bug "v_evento is not assigned yet" (add_reserva_status.sql usava
--      v_evento.is_paid antes de inicializar o RECORD v_evento)
--   2. Combina validação de períodos (update_rpcs_periodos.sql) com
--      suporte a cadastro de reserva (add_reserva_status.sql)
--   3. Usa campos de período (realizacao_inicio/fim) em vez dos legados
--
-- ESTE ARQUIVO SUBSTITUI:
--   - rpc_registrar_casal.sql
--   - rpc_registrar_individual.sql
--   - update_rpcs_periodos.sql (parcial — casal e individual)
--   - add_reserva_status.sql
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ registrar_casal_ecc — COM validação de período + Cadastro de Reserva       ║
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
    v_total_inscritos INTEGER;
BEGIN
    -- 0. Carregar evento COM TODOS os campos necessários (corrige v_evento unassigned)
    SELECT INTO v_evento
        id, nome, vagas, is_paid,
        realizacao_inicio, realizacao_fim,
        inscricao_inicio, inscricao_fim, 
        publicado, status_manual
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

    -- 5. Checar Vagas e Determinar Status / Pagamento (usando v_evento já carregado)
    SELECT COUNT(*) INTO v_total_inscritos 
    FROM inscricoes 
    WHERE evento_id = v_evento.id AND status IN ('confirmada', 'pendente');

    IF v_evento.vagas IS NOT NULL AND v_total_inscritos >= v_evento.vagas THEN
        -- Sem vagas → Cadastro de Reserva
        v_status := 'reserva';
        v_payment_method := NULL;
    ELSE
        -- Com vagas → verificar se é pago ou gratuito
        IF v_evento.is_paid THEN
            v_status := 'pendente';
            v_payment_method := 'pix';
        ELSE
            v_status := 'confirmada';
            v_payment_method := NULL;
        END IF;
    END IF;

    -- 6. Inserir Inscrição
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
        v_evento.id,
        v_esposo_id,
        v_esposa_id,
        v_diocese_id,
        NULLIF((payload->>'user_id'), '')::UUID,
        payload->'dados_conjuntos',
        v_status,
        v_payment_method
    ) RETURNING id INTO v_inscricao_id;

    -- 7. Retorno com campos de período + status de reserva
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN v_status = 'reserva' 
            THEN 'Inscrição registrada no Cadastro de Reserva!' 
            ELSE 'Inscrição realizada com sucesso!' 
        END,
        'inscricaoId', v_inscricao_id,
        'status', v_status,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.realizacao_inicio,
            'data_fim', v_evento.realizacao_fim
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
-- ║ registrar_individual_ecc — COM validação de período + Cadastro de Reserva  ║
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
    v_total_inscritos INTEGER;
BEGIN
    -- 0. Carregar evento COM TODOS os campos necessários (corrige v_evento unassigned)
    SELECT INTO v_evento
        id, nome, vagas, is_paid,
        realizacao_inicio, realizacao_fim,
        inscricao_inicio, inscricao_fim, 
        publicado, status_manual
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
        WHERE evento_id = v_evento.id 
          AND (esposo_id = v_pessoa_id OR esposa_id = v_pessoa_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este CPF já está inscrito neste evento.');
    END IF;

    -- 4. Checar Vagas e Determinar Status / Pagamento (usando v_evento já carregado)
    SELECT COUNT(*) INTO v_total_inscritos 
    FROM inscricoes 
    WHERE evento_id = v_evento.id AND status IN ('confirmada', 'pendente');

    IF v_evento.vagas IS NOT NULL AND v_total_inscritos >= v_evento.vagas THEN
        -- Sem vagas → Cadastro de Reserva
        v_status := 'reserva';
        v_payment_method := NULL;
    ELSE
        -- Com vagas → verificar se é pago ou gratuito
        IF v_evento.is_paid THEN
            v_status := 'pendente';
            v_payment_method := 'pix';
        ELSE
            v_status := 'confirmada';
            v_payment_method := NULL;
        END IF;
    END IF;

    -- 5. Inserir a Inscrição Individual
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

    -- 6. Retorno com campos de período + status de reserva
    RETURN jsonb_build_object(
        'success', true,
        'message', CASE WHEN v_status = 'reserva' 
            THEN 'Inscrição registrada no Cadastro de Reserva!' 
            ELSE 'Inscrição individual realizada com sucesso!' 
        END,
        'inscricaoId', v_inscricao_id,
        'status', v_status,
        'evento', jsonb_build_object(
            'nome', v_evento.nome,
            'data_inicio', v_evento.realizacao_inicio,
            'data_fim', v_evento.realizacao_fim
        )
    );

EXCEPTION 
    WHEN unique_violation THEN
        RETURN jsonb_build_object('success', false, 'message', 'Já existe uma inscrição para esta pessoa neste evento.');
    WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'message', 'Erro ao processar a inscrição: ' || SQLERRM);
END;
$$;


SELECT '✅ RPCs consolidadas com sucesso! (v_evento fix + períodos + reservas)' AS resultado;

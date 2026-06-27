-- ==============================================================================
-- MIGRAÇÃO: Atualizar RPCs para validar período de inscrição
-- PRD: Períodos de Evento v1.0 (Bom Pastor Digital v5.2)
-- Data: 27/06/2026
--
-- Atualiza as funções registrar_casal_ecc e registrar_individual_ecc
-- para verificar se a data atual está dentro do período de inscrição.
-- A função registrar_inscricao_admin NÃO é alterada (admin pode inscrever
-- a qualquer momento).
-- As RPCs também são atualizadas para usar os novos campos de período
-- no retorno (realizacao_inicio/realizacao_fim em vez de data_inicio/data_fim).
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ registrar_casal_ecc — COM validação de período                             ║
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
BEGIN
    -- 0. NOVA VALIDAÇÃO: Verificar período de inscrição
    SELECT INTO v_evento
        id, nome, realizacao_inicio, realizacao_fim,
        inscricao_inicio, inscricao_fim, publicado, status_manual
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

    -- 3. Obter a Diocese (agora pode vir do front-end)
    v_diocese_id := (payload->'contato'->>'diocese_id')::INTEGER;
    
    -- Fallback caso não venha no payload (compatibilidade com versões anteriores)
    IF v_diocese_id IS NULL THEN
        SELECT diocese_id INTO v_diocese_id 
        FROM municipios 
        WHERE codigo_tom = (payload->'contato'->>'municipio_id')::INTEGER;
    END IF;

    -- 4. Inserir a Inscrição (verifica se já não existe antes para este evento)
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (esposo_id IN (v_esposo_id, v_esposa_id) OR esposa_id IN (v_esposo_id, v_esposa_id))
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Um ou ambos os CPFs já estão inscritos neste evento.');
    END IF;

    -- 4b. Determinar status e método de pagamento com base no tipo do evento
    v_status := 'confirmada';
    v_payment_method := NULL;
    SELECT CASE WHEN is_paid THEN 'pendente' ELSE 'confirmada' END,
           CASE WHEN is_paid THEN 'pix' ELSE NULL END
    INTO v_status, v_payment_method
    FROM eventos WHERE id = (payload->>'evento_id')::INTEGER;

    -- Usa NULLIF para lidar com casos de user_id anônimos/undefined
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

    -- 5. Retorno com novos campos de período
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição realizada com sucesso!',
        'inscricaoId', v_inscricao_id,
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
-- ║ registrar_individual_ecc — COM validação de período                        ║
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
BEGIN
    -- 0. NOVA VALIDAÇÃO: Verificar período de inscrição
    SELECT INTO v_evento
        id, nome, realizacao_inicio, realizacao_fim,
        inscricao_inicio, inscricao_fim, publicado, status_manual
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

    -- 3. Verificar se já está inscrito neste evento
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = (payload->>'evento_id')::INTEGER 
          AND (esposo_id = v_pessoa_id OR esposa_id = v_pessoa_id)
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Este CPF já está inscrito neste evento.');
    END IF;

    -- 3b. Determinar status e método de pagamento com base no tipo do evento
    v_status := 'confirmada';
    v_payment_method := NULL;
    SELECT CASE WHEN is_paid THEN 'pendente' ELSE 'confirmada' END,
           CASE WHEN is_paid THEN 'pix' ELSE NULL END
    INTO v_status, v_payment_method
    FROM eventos WHERE id = (payload->>'evento_id')::INTEGER;

    -- 4. Inserir a Inscrição Individual (usa esposo_id para a pessoa, esposa_id fica NULL)
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

    -- 5. Retorno com novos campos de período
    RETURN jsonb_build_object(
        'success', true,
        'message', 'Inscrição individual realizada com sucesso!',
        'inscricaoId', v_inscricao_id,
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

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ registrar_inscricao_admin — SEM validação de período (admin override)      ║
-- ║ Apenas atualiza os campos de retorno para usar realizacao_inicio/fim       ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

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
    v_status VARCHAR(20);
    v_payment_method VARCHAR(50);
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

    -- 4. Determinar status e método de pagamento com base no tipo do evento
    v_status := COALESCE(payload->>'status', 'pendente');
    v_payment_method := NULL;
    IF (payload->>'evento_id') IS NOT NULL AND (payload->>'evento_id') != '' THEN
        SELECT CASE WHEN is_paid THEN 'pendente' ELSE 'confirmada' END,
               CASE WHEN is_paid THEN 'pix' ELSE NULL END
        INTO v_status, v_payment_method
        FROM eventos WHERE id = (payload->>'evento_id')::INTEGER;
    END IF;

    -- 5. Inserir Inscrição
    INSERT INTO inscricoes (
        evento_id, 
        esposo_id, 
        esposa_id, 
        diocese_id, 
        dados_conjuntos,
        tipo,
        status,
        payment_method_used
    ) VALUES (
        NULLIF((payload->>'evento_id'), '')::INTEGER,
        v_pessoa1_id,
        v_pessoa2_id,
        NULLIF((payload->>'diocese_id'), '')::INTEGER,
        COALESCE(payload->'dados_conjuntos', '{}'::JSONB),
        v_tipo,
        v_status,
        v_payment_method
    ) RETURNING id INTO v_inscricao_id;

    -- 6. Carregar evento para retorno (usando novos campos)
    IF (payload->>'evento_id') IS NOT NULL AND (payload->>'evento_id') != '' THEN
        SELECT nome, realizacao_inicio, realizacao_fim INTO v_evento
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
                    'data_inicio', v_evento.realizacao_inicio,
                    'data_fim', v_evento.realizacao_fim
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

SELECT '✅ RPCs atualizadas com sucesso!' AS resultado;

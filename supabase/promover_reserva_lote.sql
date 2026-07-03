-- ==============================================================================
-- MIGRAÇÃO: PROMOÇÃO EM LOTE DA LISTA DE ESPERA (FIFO)
-- DESCRIÇÃO: Cria a tabela de logs e a RPC para promover inscrições em lote.
-- ==============================================================================

-- 1. Criar tabela de log de promoções para auditoria
CREATE TABLE IF NOT EXISTS log_promocoes (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    admin_id UUID NOT NULL,
    quantidade INTEGER NOT NULL,
    inscricoes_promovidas UUID[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS na tabela de logs
ALTER TABLE log_promocoes ENABLE ROW LEVEL SECURITY;

-- Política: Apenas admins podem ver os logs
CREATE POLICY "Admins podem ver logs de promocoes" ON log_promocoes
    FOR SELECT
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 2. Função RPC para promover reservas em lote
CREATE OR REPLACE FUNCTION promover_reservas_lote(p_evento_id INTEGER, p_quantidade INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_id UUID;
    v_is_paid BOOLEAN;
    v_novo_status VARCHAR(20);
    v_payment_method VARCHAR(50);
    v_promovidos_count INTEGER := 0;
    v_restantes_count INTEGER := 0;
    v_promovidos_list JSONB := '[]'::JSONB;
    v_inscricoes_ids UUID[] := '{}';
    v_rec RECORD;
    v_idx INTEGER := 1;
BEGIN
    -- 1. Validar perfil do administrador
    v_admin_id := auth.uid();
    IF v_admin_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Não autenticado.');
    END IF;

    IF (auth.jwt() -> 'user_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Acesso negado. Apenas administradores.');
    END IF;

    -- 2. Verificar se o evento existe e determinar se é pago
    SELECT is_paid INTO v_is_paid FROM eventos WHERE id = p_evento_id;
    IF v_is_paid IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Evento não encontrado.');
    END IF;

    -- Definir status destino
    IF v_is_paid THEN
        v_novo_status := 'pendente';
        v_payment_method := 'pix';
    ELSE
        v_novo_status := 'confirmada';
        v_payment_method := NULL;
    END IF;

    -- 3. Loop pelos N primeiros da fila de reserva (FIFO)
    FOR v_rec IN (
        SELECT 
            i.id AS inscricao_id,
            p_esp.nome AS esposo_nome,
            p_esp.telefone AS esposo_telefone,
            p_esp.email AS esposo_email,
            p_espa.nome AS esposa_nome,
            p_espa.telefone AS esposa_telefone,
            p_espa.email AS esposa_email
        FROM inscricoes i
        LEFT JOIN pessoas p_esp ON p_esp.id = i.esposo_id
        LEFT JOIN pessoas p_espa ON p_espa.id = i.esposa_id
        WHERE i.evento_id = p_evento_id AND i.status = 'reserva'
        ORDER BY i.created_at ASC
        LIMIT p_quantidade
    ) LOOP
        -- Atualizar inscrição
        UPDATE inscricoes 
        SET 
            status = v_novo_status,
            payment_method_used = v_payment_method,
            updated_at = now()
        WHERE id = v_rec.inscricao_id;

        -- Adicionar ID à lista de promovidos
        v_inscricoes_ids := array_append(v_inscricoes_ids, v_rec.inscricao_id);

        -- Montar JSON do promovido
        v_promovidos_list := v_promovidos_list || jsonb_build_object(
            'inscricao_id', v_rec.inscricao_id,
            'posicao_anterior', v_idx,
            'esposo_nome', COALESCE(v_rec.esposo_nome, ''),
            'esposo_telefone', COALESCE(v_rec.esposo_telefone, ''),
            'esposo_email', COALESCE(v_rec.esposo_email, ''),
            'esposa_nome', COALESCE(v_rec.esposa_nome, ''),
            'esposa_telefone', COALESCE(v_rec.esposa_telefone, ''),
            'esposa_email', COALESCE(v_rec.esposa_email, ''),
            'novo_status', v_novo_status
        );

        v_promovidos_count := v_promovidos_count + 1;
        v_idx := v_idx + 1;
    END LOOP;

    -- 4. Registrar log se houve promoções
    IF v_promovidos_count > 0 THEN
        INSERT INTO log_promocoes (evento_id, admin_id, quantidade, inscricoes_promovidas)
        VALUES (p_evento_id, v_admin_id, v_promovidos_count, v_inscricoes_ids);
    END IF;

    -- 5. Contar restantes na fila
    SELECT COUNT(*) INTO v_restantes_count
    FROM inscricoes
    WHERE evento_id = p_evento_id AND status = 'reserva';

    RETURN jsonb_build_object(
        'success', true,
        'promovidos', v_promovidos_list,
        'total_promovidos', v_promovidos_count,
        'restantes_na_fila', v_restantes_count
    );
END;
$$;

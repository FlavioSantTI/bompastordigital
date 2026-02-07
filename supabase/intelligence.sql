-- ========================================================
-- BOM PASTOR DIGITAL (V1.0) - FASE 2: INTELIGÊNCIA
-- ========================================================

-- 1. FUNÇÃO PARA VERIFICAR DISPONIBILIDADE DO CASAL (RPC)
-- Esta função será chamada pelo Frontend antes de confirmar a inscrição.
CREATE OR REPLACE FUNCTION check_couple_availability(
    p_evento_id INTEGER,
    p_cpf_esposo TEXT,
    p_cpf_esposa TEXT
) RETURNS TABLE (disponivel BOOLEAN, mensagem TEXT) AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Verifica se o esposo já está no evento
    SELECT COUNT(*) INTO v_count
    FROM inscricoes i
    JOIN pessoas p ON (i.esposo_id = p.id OR i.esposa_id = p.id)
    WHERE i.evento_id = p_evento_id
    AND p.cpf = p_cpf_esposo;

    IF v_count > 0 THEN
        RETURN QUERY SELECT FALSE, 'O CPF do esposo já possui inscrição para este evento.'::TEXT;
        RETURN;
    END IF;

    -- Verifica se a esposa já está no evento
    SELECT COUNT(*) INTO v_count
    FROM inscricoes i
    JOIN pessoas p ON (i.esposo_id = p.id OR i.esposa_id = p.id)
    WHERE i.evento_id = p_evento_id
    AND p.cpf = p_cpf_esposa;

    IF v_count > 0 THEN
        RETURN QUERY SELECT FALSE, 'O CPF da esposa já possui inscrição para este evento.'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT TRUE, 'Disponível'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. HABILITAR RLS (ROW LEVEL SECURITY)
-- Importante para garantir que os dados não fiquem públicos acidentalmente
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;
ALTER TABLE dioceses ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACESSO (POLICIES)

-- Municipios e Dioceses: Leitura pública (para preencher o formulário)
CREATE POLICY "Leitura pública de municípios" ON municipios FOR SELECT USING (true);
CREATE POLICY "Leitura pública de dioceses" ON dioceses FOR SELECT USING (true);

-- Eventos: Leitura pública (para o participante escolher)
CREATE POLICY "Leitura pública de eventos" ON eventos FOR SELECT USING (true);

-- Inscrições: Apenas o usuário que criou (baseado em email no futuro) ou ADMIN pode ver
-- Por enquanto, vamos permitir inserção para anon/authenticated para o formulário funcionar
CREATE POLICY "Permitir inserção de inscrições" ON inscricoes FOR INSERT WITH CHECK (true);

-- 4. LOGS DE AUDITORIA (OPCIONAL/BASE)
CREATE TABLE IF NOT EXISTS logs_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tabela VARCHAR(50),
    operacao VARCHAR(20),
    dados_novos JSONB,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE OR REPLACE FUNCTION trigger_log_inscricao() RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO logs_auditoria (tabela, operacao, dados_novos)
    VALUES ('inscricoes', TG_OP, row_to_json(NEW)::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_inscricoes
AFTER INSERT OR UPDATE ON inscricoes
FOR EACH ROW EXECUTE FUNCTION trigger_log_inscricao();

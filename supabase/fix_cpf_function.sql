-- ================================================================
-- CORRIGIR FUNÇÃO DE VALIDAÇÃO DE DISPONIBILIDADE
-- Projeto: Bom Pastor Digital
-- ================================================================

-- Dropar função antiga (se existir)
DROP FUNCTION IF EXISTS check_couple_availability(INTEGER, VARCHAR, VARCHAR);

-- Recriar função com parâmetros CPF formatados
CREATE OR REPLACE FUNCTION check_couple_availability(
    p_evento_id INTEGER,
    p_cpf_esposo VARCHAR(14), -- CPF formatado: 000.000.000-00
    p_cpf_esposa VARCHAR(14)  -- CPF formatado: 000.000.000-00
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    v_esposo_id UUID;
    v_esposa_id UUID;
BEGIN
    -- Buscar IDs das pessoas pelos CPFs
    SELECT id INTO v_esposo_id FROM pessoas WHERE cpf = p_cpf_esposo;
    SELECT id INTO v_esposa_id FROM pessoas WHERE cpf = p_cpf_esposa;
    
    -- Se ambos não existem, está disponível
    IF v_esposo_id IS NULL AND v_esposa_id IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Verificar se algum já está inscrito neste evento
    IF EXISTS (
        SELECT 1 FROM inscricoes 
        WHERE evento_id = p_evento_id 
        AND (esposo_id = v_esposo_id OR esposa_id = v_esposa_id)
    ) THEN
        RETURN FALSE; -- Já inscrito
    END IF;
    
    -- Disponível
    RETURN TRUE;
END;
$$;

-- Mensagem de confirmação
SELECT 'Função check_couple_availability atualizada com sucesso!' as mensagem;

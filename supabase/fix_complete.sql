-- ================================================================
-- DIAGNÓSTICO E CORREÇÃO COMPLETA
-- Projeto: Bom Pastor Digital
-- ================================================================

-- 1. Verificar se a função existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'check_couple_availability';

-- 2. Dropar função antiga (todas as variações)
DROP FUNCTION IF EXISTS check_couple_availability(INTEGER, VARCHAR, VARCHAR);
DROP FUNCTION IF EXISTS check_couple_availability(INTEGER, TEXT, TEXT);

-- 3. Recriar função corretamente
CREATE OR REPLACE FUNCTION check_couple_availability(
    p_evento_id INTEGER,
    p_cpf_esposo VARCHAR(14),
    p_cpf_esposa VARCHAR(14)
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
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 4. Testar a função com dados de exemplo
SELECT check_couple_availability(
    1, -- evento_id
    '123.456.789-00', -- CPF esposo teste
    '987.654.321-00'  -- CPF esposa teste
) as disponivel;

-- 5. Verificar estrutura da tabela pessoas
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'pessoas'
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Diagnóstico e correção completos!' as mensagem;

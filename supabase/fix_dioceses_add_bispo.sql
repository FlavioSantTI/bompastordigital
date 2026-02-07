-- ================================================================
-- CORRIGIR TABELA DIOCESES - Adicionar coluna BISPO
-- ================================================================

-- Verificar estrutura atual da tabela dioceses
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dioceses'
ORDER BY ordinal_position;

-- Adicionar coluna bispo (se não existir)
ALTER TABLE dioceses 
ADD COLUMN IF NOT EXISTS bispo VARCHAR(255);

-- Verificar estrutura após alteração
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'dioceses'
ORDER BY ordinal_position;

SELECT '✅ Coluna bispo adicionada com sucesso!' as status;

-- ================================================================
-- ADICIONAR TIPO DE INSCRIÇÃO (casal / individual)
-- ================================================================

-- 1. Adicionar coluna tipo
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'casal';

-- 2. Permitir esposo_id e esposa_id serem NULL (para individual)
-- Já são nullable no schema original, apenas confirmando
-- ALTER TABLE inscricoes ALTER COLUMN esposo_id DROP NOT NULL;
-- ALTER TABLE inscricoes ALTER COLUMN esposa_id DROP NOT NULL;

-- 3. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_inscricoes_tipo ON inscricoes(tipo);

-- 4. Marcar todas as inscrições existentes como 'casal'
UPDATE inscricoes SET tipo = 'casal' WHERE tipo IS NULL;

SELECT '✅ Coluna tipo adicionada com sucesso!' as resultado;

-- Verificar
SELECT tipo, COUNT(*) as total
FROM inscricoes
GROUP BY tipo;

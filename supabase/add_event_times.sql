-- ================================================================
-- ADICIONAR CAMPOS DE HORA NOS EVENTOS
-- Projeto: Bom Pastor Digital
-- ================================================================

-- Adicionar colunas de hora (se não existirem)
ALTER TABLE eventos 
ADD COLUMN IF NOT EXISTS hora_inicio TIME,
ADD COLUMN IF NOT EXISTS hora_fim TIME;

-- Verificar estrutura atualizada
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'eventos' 
ORDER BY ordinal_position;

SELECT 'Campos de hora adicionados com sucesso!' as mensagem;

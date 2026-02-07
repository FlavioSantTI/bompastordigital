-- ================================================================
-- SCRIPT DE TESTE: Verificar Conexão e Estrutura do Banco
-- Projeto: Bom Pastor Digital
-- Data: 05/02/2026
-- ================================================================

-- 1. Verificar se as tabelas existem
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Contar registros em cada tabela
SELECT 'municipios' as tabela, COUNT(*) as total FROM municipios
UNION ALL
SELECT 'dioceses', COUNT(*) FROM dioceses
UNION ALL
SELECT 'pessoas', COUNT(*) FROM pessoas
UNION ALL
SELECT 'eventos', COUNT(*) FROM eventos
UNION ALL
SELECT 'inscricoes', COUNT(*) FROM inscricoes;

-- 3. Verificar constraints e foreign keys
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

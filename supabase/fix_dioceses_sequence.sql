-- ================================================================
-- CORRIGIR SEQUENCE DA TABELA DIOCESES (SIMPLIFICADO)
-- ================================================================

-- 1. Verificar situação atual
SELECT 
    'Maior ID na tabela' as info,
    MAX(id) as valor 
FROM dioceses;

-- 2. Resetar sequence para próximo valor correto
SELECT setval('dioceses_id_seq', 
    (SELECT COALESCE(MAX(id), 0) + 1 FROM dioceses), 
    false
);

-- 3. Verificar depois da correção
SELECT 
    'Próximo ID que será usado' as info,
    last_value as valor 
FROM dioceses_id_seq;

SELECT '✅ Sequence corrigida com sucesso!' as status;

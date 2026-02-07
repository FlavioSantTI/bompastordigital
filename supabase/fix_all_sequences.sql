-- ================================================================
-- CORRIGIR TODAS AS SEQUENCES - Dioceses e Eventos
-- ================================================================

-- DIOCESES
SELECT '=== DIOCESES ===' as tabela;
SELECT MAX(id) as maior_id_atual FROM dioceses;
SELECT last_value as sequence_atual FROM dioceses_id_seq;

SELECT setval('dioceses_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM dioceses), false);
SELECT '✅ Dioceses: Sequence corrigida!' as status;

-- EVENTOS
SELECT '=== EVENTOS ===' as tabela;
SELECT MAX(id) as maior_id_atual FROM eventos;
SELECT last_value as sequence_atual FROM eventos_id_seq;

SELECT setval('eventos_id_seq', (SELECT COALESCE(MAX(id), 0) + 1 FROM eventos), false);
SELECT '✅ Eventos: Sequence corrigida!' as status;

-- VERIFICAÇÃO FINAL
SELECT 
    'dioceses' as tabela,
    (SELECT MAX(id) FROM dioceses) as maior_id,
    (SELECT last_value FROM dioceses_id_seq) as proximo_id
UNION ALL
SELECT 
    'eventos' as tabela,
    (SELECT MAX(id) FROM eventos) as maior_id,
    (SELECT last_value FROM eventos_id_seq) as proximo_id;

SELECT '✅ TODAS AS SEQUENCES CORRIGIDAS!' as resultado;

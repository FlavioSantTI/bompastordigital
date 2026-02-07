-- ================================================================
-- CRIAR EVENTO DE TESTE
-- Projeto: Bom Pastor Digital
-- ================================================================

-- Criar um evento de teste em São Paulo
INSERT INTO eventos (nome, data_inicio, data_fim, municipio_id, vagas, status) 
SELECT 
    'Encontro de Casais com Cristo - Março 2026',
    '2026-03-15',
    '2026-03-17',
    codigo_tom,
    100,
    'aberto'
FROM municipios 
WHERE nome_ibge = 'Palmas' AND uf = 'TO'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verificação
SELECT * FROM eventos;

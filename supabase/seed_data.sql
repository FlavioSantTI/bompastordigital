-- ================================================================
-- DADOS DE TESTE: Dioceses e Evento
-- Projeto: Bom Pastor Digital
-- Nota: Municípios já estão populados no banco
-- ================================================================

-- Inserir algumas dioceses de teste (vinculadas aos municípios existentes)
INSERT INTO dioceses (nome_completo, bispo, uf) VALUES
('Arquidiocese de São Paulo', 'Dom Odilo Pedro Scherer', 'SP'),
('Arquidiocese de Rio de Janeiro', 'Dom Orani João Tempesta', 'RJ'),
('Arquidiocese de Belo Horizonte', 'Dom Walmor Oliveira de Azevedo', 'MG'),
('Arquidiocese de Brasília', 'Dom Paulo Cezar Costa', 'DF'),
('Arquidiocese de Porto Alegre', 'Dom Jaime Spengler', 'RS'),
('Diocese de Curitiba', 'Dom José Antônio Peruzzo', 'PR'),
('Arquidiocese de Salvador', 'Dom Sérgio da Rocha', 'BA'),
('Arquidiocese de Fortaleza', 'Dom José Antonio Aparecido Tosi Marques', 'CE'),
('Arquidiocese de Recife', 'Dom Paulo Jackson Nóbrega de Sousa', 'PE'),
('Arquidiocese de Manaus', 'Dom Leonardo Ulrich Steiner', 'AM')
ON CONFLICT DO NOTHING;

-- Vincular alguns municípios principais às dioceses
-- Nota: Você precisará ajustar os IDs conforme sua estrutura
UPDATE municipios SET diocese_id = 1 WHERE nome_ibge = 'São Paulo' AND uf = 'SP';
UPDATE municipios SET diocese_id = 2 WHERE nome_ibge = 'Rio de Janeiro' AND uf = 'RJ';
UPDATE municipios SET diocese_id = 3 WHERE nome_ibge = 'Belo Horizonte' AND uf = 'MG';
UPDATE municipios SET diocese_id = 4 WHERE nome_ibge = 'Brasília' AND uf = 'DF';
UPDATE municipios SET diocese_id = 5 WHERE nome_ibge = 'Porto Alegre' AND uf = 'RS';
UPDATE municipios SET diocese_id = 6 WHERE nome_ibge = 'Curitiba' AND uf = 'PR';
UPDATE municipios SET diocese_id = 7 WHERE nome_ibge = 'Salvador' AND uf = 'BA';
UPDATE municipios SET diocese_id = 8 WHERE nome_ibge = 'Fortaleza' AND uf = 'CE';
UPDATE municipios SET diocese_id = 9 WHERE nome_ibge = 'Recife' AND uf = 'PE';
UPDATE municipios SET diocese_id = 10 WHERE nome_ibge = 'Manaus' AND uf = 'AM';

-- Criar um evento de teste
INSERT INTO eventos (nome, data_inicio, data_fim, municipio_id, vagas, status) 
SELECT 
    'Encontro de Casais - Março 2026',
    '2026-03-15',
    '2026-03-17',
    codigo_tom,
    50,
    'aberto'
FROM municipios 
WHERE nome_ibge = 'São Paulo' AND uf = 'SP'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verificação
SELECT 'Dados inseridos!' as mensagem;
SELECT COUNT(*) as total_dioceses FROM dioceses;
SELECT COUNT(*) as total_municipios FROM municipios;
SELECT COUNT(*) as total_eventos FROM eventos;

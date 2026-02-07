-- ========================================================
-- BOM PASTOR DIGITAL (V1.0) - SCHEMA CORE
-- ========================================================

-- 1. FUNDAÇÃO GEOGRÁFICA
CREATE TABLE IF NOT EXISTS municipios (
    codigo_tom INTEGER PRIMARY KEY,
    codigo_ibge VARCHAR(10) UNIQUE NOT NULL,
    nome_ibge VARCHAR(255) NOT NULL,
    uf CHAR(2) NOT NULL,
    diocese_id INTEGER -- Mudado de UUID para INTEGER
);

-- 2. DIVISÃO TERRITORIAL ECLESIAL
CREATE TABLE IF NOT EXISTS dioceses (
    id SERIAL PRIMARY KEY, -- Mudado de UUID para SERIAL
    nome_completo VARCHAR(255) NOT NULL,
    bispo VARCHAR(255),
    sede_id INTEGER REFERENCES municipios(codigo_tom),
    uf CHAR(2) NOT NULL
);

-- Adicionar Chave Estrangeira cíclica em municipios
ALTER TABLE municipios 
    ADD CONSTRAINT fk_municipio_diocese 
    FOREIGN KEY (diocese_id) 
    REFERENCES dioceses(id) 
    ON DELETE SET NULL;

-- 3. PESSOAS (IDENTIDADE INDIVIDUAL)
CREATE TABLE IF NOT EXISTS pessoas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpf VARCHAR(14) UNIQUE NOT NULL, -- Formato: 000.000.000-00
    nome VARCHAR(255) NOT NULL,
    nascimento DATE NOT NULL,
    email VARCHAR(255),
    telefone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. EVENTOS
CREATE TABLE IF NOT EXISTS eventos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    municipio_id INTEGER REFERENCES municipios(codigo_tom),
    vagas INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'aberto', -- aberto, em_andamento, concluído, cancelado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. INSCRIÇÕES (UNIDADE ATÔMICA DE CASAL)
CREATE TABLE IF NOT EXISTS inscricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    esposo_id UUID REFERENCES pessoas(id),
    esposa_id UUID REFERENCES pessoas(id),
    diocese_id INTEGER REFERENCES dioceses(id), -- Mudado de UUID para INTEGER
    dados_conjuntos JSONB NOT NULL, -- Endereço, Paróquia, Saúde, Restrições
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Integridade: CPF único por evento
    CONSTRAINT unique_esposo_evento UNIQUE (evento_id, esposo_id),
    CONSTRAINT unique_esposa_evento UNIQUE (evento_id, esposa_id)
);

-- 6. ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_municipios_diocese ON municipios(diocese_id);
CREATE INDEX IF NOT EXISTS idx_inscricoes_evento ON inscricoes(evento_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_cpf ON pessoas(cpf);

-- COMENTÁRIOS DE TABELA
COMMENT ON TABLE municipios IS 'Base oficial de municípios do Brasil (IBGE/TOM).';
COMMENT ON TABLE dioceses IS 'Divisão territorial eclesial do Brasil.';
COMMENT ON TABLE inscricoes IS 'Gestão de inscrições de casais. Cada linha representa um casal.';

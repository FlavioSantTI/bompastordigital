-- ================================================================
-- MIGRATION: Módulo de CRUD de Círculos (v6.5)
-- ================================================================

-- 1. Criar Tabela de Círculos (se não existir)
CREATE TABLE IF NOT EXISTS circulos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id BIGINT NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7) NOT NULL DEFAULT '#0284C7',
    esposo_coordenador_id UUID NOT NULL REFERENCES pessoas(id),
    esposa_coordenador_id UUID REFERENCES pessoas(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.1 Garantir que as colunas existam caso a tabela já estivesse criada anteriormente
ALTER TABLE circulos ADD COLUMN IF NOT EXISTS esposo_coordenador_id UUID REFERENCES pessoas(id);
ALTER TABLE circulos ADD COLUMN IF NOT EXISTS esposa_coordenador_id UUID REFERENCES pessoas(id);
ALTER TABLE circulos ADD COLUMN IF NOT EXISTS cor VARCHAR(7) DEFAULT '#0284C7';
ALTER TABLE circulos ADD COLUMN IF NOT EXISTS descricao TEXT;

-- 2. Criar Tabela Associativa circulo_membros
CREATE TABLE IF NOT EXISTS circulo_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    circulo_id UUID NOT NULL REFERENCES circulos(id) ON DELETE CASCADE,
    inscricao_id UUID NOT NULL REFERENCES inscricoes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_circulo_inscricao UNIQUE(circulo_id, inscricao_id)
);

-- 3. Índices para Otimização de Consultas
CREATE INDEX IF NOT EXISTS idx_circulos_evento_id ON circulos(evento_id);
CREATE INDEX IF NOT EXISTS idx_circulo_membros_circulo_id ON circulo_membros(circulo_id);
CREATE INDEX IF NOT EXISTS idx_circulo_membros_inscricao_id ON circulo_membros(inscricao_id);

-- 4. Trigger de Atualização Automática de updated_at
CREATE OR REPLACE FUNCTION update_circulos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_circulos_updated_at ON circulos;
CREATE TRIGGER trigger_update_circulos_updated_at
    BEFORE UPDATE ON circulos
    FOR EACH ROW
    EXECUTE FUNCTION update_circulos_updated_at();

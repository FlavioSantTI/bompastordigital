-- ================================================================
-- CORREÇÃO: SETUP DE COMPROVANTES (TIPO INTEGER)
-- ================================================================

-- 1. Limpar tentativa anterior
DROP TABLE IF EXISTS comprovantes_inscricao;

-- 2. Criar tabela com inscricao_id como INTEGER (compatível com SERIAL)
CREATE TABLE IF NOT EXISTS comprovantes_inscricao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- ALTERADO DE BIGINT PARA INTEGER PARA CORRESPONDER AO TIPO SERIAL DA TABELA INSCRICOES
    inscricao_id INTEGER REFERENCES inscricoes(id) ON DELETE CASCADE NOT NULL,
    url_storage TEXT NOT NULL,
    path_storage TEXT NOT NULL,
    tipo_mimetype TEXT NOT NULL,
    upload_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Índices e Policies (Reaplicando para garantir)
CREATE INDEX IF NOT EXISTS idx_comprovantes_inscricao_id ON comprovantes_inscricao(inscricao_id);

ALTER TABLE comprovantes_inscricao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserção de comprovantes" ON comprovantes_inscricao;
CREATE POLICY "Permitir inserção de comprovantes"
ON comprovantes_inscricao FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de comprovantes" ON comprovantes_inscricao;
CREATE POLICY "Permitir leitura de comprovantes"
ON comprovantes_inscricao FOR SELECT
USING (true);

-- Garantir que o bucket existe
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes', 'comprovantes', true) ON CONFLICT (id) DO NOTHING;

-- Policies do Storage
DROP POLICY IF EXISTS "Permitir upload de comprovantes" ON storage.objects;
CREATE POLICY "Permitir upload de comprovantes" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'comprovantes' );

DROP POLICY IF EXISTS "Permitir visualizar comprovantes" ON storage.objects;
CREATE POLICY "Permitir visualizar comprovantes" ON storage.objects FOR SELECT USING ( bucket_id = 'comprovantes' );

SELECT '✅ Tabela comprovantes_inscricao criada com sucesso (INTEGER)!' as resultado;

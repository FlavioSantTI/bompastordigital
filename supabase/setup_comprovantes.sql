-- ================================================================
-- CONFIGURAÇÃO DE UPLOAD DE COMPROVANTES
-- ================================================================

-- 1. Criar o Bucket 'comprovantes' (se não existir)
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprovantes', 'comprovantes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Criar tabela de vínculo comprovantes_inscricao
CREATE TABLE IF NOT EXISTS comprovantes_inscricao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inscricao_id BIGINT REFERENCES inscricoes(id) ON DELETE CASCADE NOT NULL,
    url_storage TEXT NOT NULL,
    path_storage TEXT NOT NULL, -- Importante para deletar o arquivo depois se necessário
    tipo_mimetype TEXT NOT NULL,
    upload_por UUID REFERENCES auth.users(id), -- Pode ser null se não tiver user logado ainda
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_comprovantes_inscricao_id ON comprovantes_inscricao(inscricao_id);

-- 4. Políticas de Segurança (RLS) para o Bucket
-- Permitir upload público (para este momento de dev) ou restrito a authenticated
CREATE POLICY "Permitir upload de comprovantes"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'comprovantes' );

CREATE POLICY "Permitir visualizar comprovantes"
ON storage.objects FOR SELECT
USING ( bucket_id = 'comprovantes' );

-- 5. Políticas de Segurança (RLS) para a Tabela
ALTER TABLE comprovantes_inscricao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir inserção de comprovantes"
ON comprovantes_inscricao FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir leitura de comprovantes"
ON comprovantes_inscricao FOR SELECT
USING (true);

SELECT '✅ Infraestrutura de comprovantes configurada com sucesso!' as resultado;

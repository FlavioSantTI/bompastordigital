-- ================================================================
-- MIGRATION: Módulo de Arquivamento de Mídias e Documentos (v7.3.0)
-- ================================================================

-- 1. Criar Tabela Isolada de Arquivos de Eventos
CREATE TABLE IF NOT EXISTS public.evento_arquivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evento_id BIGINT NOT NULL REFERENCES public.eventos(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    nome_original VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) DEFAULT 'documentos', -- 'planilhas', 'liturgia', 'foto', 'video', 'audio', 'documentos'
    tamanho_bytes BIGINT NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    criado_por UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índice para consultas rápidas por evento (cota e listagem instantâneas)
CREATE INDEX IF NOT EXISTS idx_evento_arquivos_evento_id ON public.evento_arquivos(evento_id);
CREATE INDEX IF NOT EXISTS idx_evento_arquivos_categoria ON public.evento_arquivos(categoria);

-- 3. Habilitação de RLS
ALTER TABLE public.evento_arquivos ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de RLS para usuários autenticados (Admin e Coordenadores)
DROP POLICY IF EXISTS "Autenticados podem ler arquivos de eventos" ON public.evento_arquivos;
CREATE POLICY "Autenticados podem ler arquivos de eventos"
ON public.evento_arquivos FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Autenticados podem inserir arquivos de eventos" ON public.evento_arquivos;
CREATE POLICY "Autenticados podem inserir arquivos de eventos"
ON public.evento_arquivos FOR INSERT
TO authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Autenticados podem atualizar arquivos de eventos" ON public.evento_arquivos;
CREATE POLICY "Autenticados podem atualizar arquivos de eventos"
ON public.evento_arquivos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Autenticados podem excluir arquivos de eventos" ON public.evento_arquivos;
CREATE POLICY "Autenticados podem excluir arquivos de eventos"
ON public.evento_arquivos FOR DELETE
TO authenticated
USING (true);

-- 5. Trigger de Atualização Automática de updated_at
CREATE OR REPLACE FUNCTION update_evento_arquivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_evento_arquivos_updated_at ON public.evento_arquivos;
CREATE TRIGGER trigger_update_evento_arquivos_updated_at
BEFORE UPDATE ON public.evento_arquivos
FOR EACH ROW
EXECUTE FUNCTION update_evento_arquivos_updated_at();

-- 6. Políticas de RLS para o Supabase Storage (Bucket: eventos_midias)
-- Permite leitura de arquivos
DROP POLICY IF EXISTS "eventos_midias_select" ON storage.objects;
CREATE POLICY "eventos_midias_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'eventos_midias');

-- Permite upload (INSERT) no bucket
DROP POLICY IF EXISTS "eventos_midias_insert" ON storage.objects;
CREATE POLICY "eventos_midias_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'eventos_midias');

-- Permite exclusão (DELETE) no bucket
DROP POLICY IF EXISTS "eventos_midias_delete" ON storage.objects;
CREATE POLICY "eventos_midias_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'eventos_midias');

-- Permite atualização (UPDATE) no bucket
DROP POLICY IF EXISTS "eventos_midias_update" ON storage.objects;
CREATE POLICY "eventos_midias_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'eventos_midias');


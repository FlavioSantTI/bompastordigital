-- Criação da Tabela de Logs de QR Code
CREATE TABLE IF NOT EXISTS public.qrcode_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    data_geracao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    turno TEXT NOT NULL,
    codigo_gerado TEXT NOT NULL,
    numero_whatsapp TEXT NOT NULL,
    usuario_admin_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ativar Segurança em Nível de Linha (RLS)
ALTER TABLE public.qrcode_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso para Administradores
-- Permite que usuários logados insiram logs
CREATE POLICY "Autenticados podem inserir log QR Code" ON public.qrcode_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = usuario_admin_id);

-- Permite que usuários logados visualizem histórico
CREATE POLICY "Autenticados podem ler log QR Code" ON public.qrcode_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- ==============================================================================
-- MIGRAÇÃO: Adicionar campos financeiros para suporte a Eventos Pagos
-- PRD: Condicional de Evento Pago vs. Gratuito, PIX e QR Code
-- ==============================================================================

-- 1. TABELA EVENTOS — Novos campos financeiros
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS event_price DECIMAL(10,2);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS pix_key_type VARCHAR(20);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS merchant_name VARCHAR(150);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS merchant_city VARCHAR(100);
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB DEFAULT '["pix"]'::JSONB;

-- 2. TABELA INSCRICOES — Método de pagamento utilizado
ALTER TABLE inscricoes ADD COLUMN IF NOT EXISTS payment_method_used VARCHAR(50);

-- 3. CONSTRAINT — Garantir integridade dos dados de pagamento
-- Se is_paid = true, todos os campos PIX são obrigatórios
-- Remove a constraint caso já exista (para reexecução segura)
DO $$ BEGIN
    ALTER TABLE eventos DROP CONSTRAINT IF EXISTS chk_event_payment_fields;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE eventos ADD CONSTRAINT chk_event_payment_fields CHECK (
    (NOT is_paid) OR (
        is_paid AND
        event_price IS NOT NULL AND event_price > 0 AND
        pix_key_type IS NOT NULL AND
        pix_key IS NOT NULL AND
        merchant_name IS NOT NULL AND
        merchant_city IS NOT NULL
    )
);

-- 4. ÍNDICE para performance em queries filtradas por tipo
CREATE INDEX IF NOT EXISTS idx_eventos_is_paid ON eventos(is_paid);

-- 5. VERIFICAÇÃO
SELECT
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'eventos'
  AND column_name IN ('is_paid', 'event_price', 'pix_key_type', 'pix_key', 'merchant_name', 'merchant_city', 'accepted_payment_methods')
ORDER BY ordinal_position;

SELECT '✅ Migração de campos financeiros aplicada com sucesso!' AS resultado;

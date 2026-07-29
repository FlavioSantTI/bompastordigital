-- ============================================================
-- Migração: Adicionar campo permite_individual à tabela eventos
-- Versão: 6.2
-- Data: 2026-07-29
-- Descrição: Permite ao admin configurar por evento se inscrições
--            individuais são aceitas. Default TRUE para manter
--            compatibilidade com eventos existentes.
-- ============================================================

-- Adicionar a coluna (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'eventos'
        AND column_name = 'permite_individual'
    ) THEN
        ALTER TABLE eventos
        ADD COLUMN permite_individual BOOLEAN NOT NULL DEFAULT TRUE;

        RAISE NOTICE '✅ Coluna permite_individual adicionada com sucesso à tabela eventos.';
    ELSE
        RAISE NOTICE '⚠️ Coluna permite_individual já existe na tabela eventos. Nenhuma alteração feita.';
    END IF;
END $$;

-- Comentário descritivo
COMMENT ON COLUMN eventos.permite_individual IS 'Controla se o evento aceita inscrições individuais (true) ou somente casais (false). Padrão: true.';

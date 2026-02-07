-- ================================================================
-- ADICIONAR STATUS DE CONFIRMAÇÃO NAS INSCRIÇÕES
-- ================================================================

-- 1. Adicionar coluna status
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pendente';

-- 2. Criar tipo enum (opcional, mas mais seguro)
DO $$ BEGIN
    CREATE TYPE status_inscricao AS ENUM ('pendente', 'confirmada', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Atualizar coluna para usar o enum (se preferir)
-- ALTER TABLE inscricoes ALTER COLUMN status TYPE status_inscricao USING status::status_inscricao;

-- 4. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_inscricoes_status ON inscricoes(status);

-- 5. Atualizar inscrições existentes para 'confirmada' (se quiser)
UPDATE inscricoes SET status = 'confirmada' WHERE status IS NULL OR status = 'pendente';

SELECT '✅ Coluna status adicionada com sucesso!' as resultado;

-- Verificar
SELECT status, COUNT(*) as total
FROM inscricoes
GROUP BY status;

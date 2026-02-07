-- ================================================================
-- GARANTIR RLS EM INSCRIÇÕES E PESSOAS
-- ================================================================

-- Habilitar RLS
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;

-- Criar políticas permissivas (DESENVOLVIMENTO)
DROP POLICY IF EXISTS "Permitir tudo em pessoas" ON pessoas;
CREATE POLICY "Permitir tudo em pessoas"
ON pessoas FOR ALL
USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo em inscricoes" ON inscricoes;
CREATE POLICY "Permitir tudo em inscricoes"
ON inscricoes FOR ALL
USING (true) WITH CHECK (true);

-- Verificar
SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('pessoas', 'inscricoes');

SELECT '✅ RLS configurado para inscrições e pessoas!' as status;

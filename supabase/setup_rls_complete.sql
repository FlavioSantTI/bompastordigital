-- ================================================================
-- SCRIPT RÁPIDO: Verificar e Criar Políticas RLS
-- Execute este script para garantir que todas as políticas estejam ativas
-- ================================================================

-- 1. Verificar tabelas e RLS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('dioceses', 'eventos', 'pessoas', 'inscricoes', 'municipios')
ORDER BY tablename;

-- 2. Habilitar RLS em todas as tabelas necessárias
ALTER TABLE dioceses ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE municipios ENABLE ROW LEVEL SECURITY;

-- 3. Criar políticas permissivas (DESENVOLVIMENTO)
-- DIOCESES
DROP POLICY IF EXISTS "Permitir tudo em dioceses" ON dioceses;
CREATE POLICY "Permitir tudo em dioceses"
ON dioceses FOR ALL
USING (true) WITH CHECK (true);

-- EVENTOS
DROP POLICY IF EXISTS "Permitir tudo em eventos" ON eventos;
CREATE POLICY "Permitir tudo em eventos"
ON eventos FOR ALL
USING (true) WITH CHECK (true);

-- PESSOAS
DROP POLICY IF EXISTS "Permitir tudo em pessoas" ON pessoas;
CREATE POLICY "Permitir tudo em pessoas"
ON pessoas FOR ALL
USING (true) WITH CHECK (true);

-- INSCRIÇÕES
DROP POLICY IF EXISTS "Permitir tudo em inscricoes" ON inscricoes;
CREATE POLICY "Permitir tudo em inscricoes"
ON inscricoes FOR ALL
USING (true) WITH CHECK (true);

-- MUNICÍPIOS (apenas leitura)
DROP POLICY IF EXISTS "Permitir leitura em municipios" ON municipios;
CREATE POLICY "Permitir leitura em municipios"
ON municipios FOR SELECT
USING (true);

-- 4. Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '✅ Todas as políticas RLS foram configuradas!' as status;

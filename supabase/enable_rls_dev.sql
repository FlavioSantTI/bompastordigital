-- ================================================================
-- POLÍTICAS RLS PARA AMBIENTE DE DESENVOLVIMENTO
-- Projeto: Bom Pastor Digital
-- ATENÇÃO: Estas políticas são permissivas para desenvolvimento
-- Em produção, implemente autenticação e políticas mais restritivas
-- ================================================================

-- 1. HABILITAR RLS nas tabelas (se não estiver)
ALTER TABLE dioceses ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inscricoes ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PERMISSIVAS PARA DESENVOLVIMENTO
-- Permite todas as operações (SELECT, INSERT, UPDATE, DELETE)

-- DIOCESES
DROP POLICY IF EXISTS "Permitir tudo em dioceses" ON dioceses;
CREATE POLICY "Permitir tudo em dioceses"
ON dioceses
FOR ALL
USING (true)
WITH CHECK (true);

-- EVENTOS
DROP POLICY IF EXISTS "Permitir tudo em eventos" ON eventos;
CREATE POLICY "Permitir tudo em eventos"
ON eventos
FOR ALL
USING (true)
WITH CHECK (true);

-- PESSOAS
DROP POLICY IF EXISTS "Permitir tudo em pessoas" ON pessoas;
CREATE POLICY "Permitir tudo em pessoas"
ON pessoas
FOR ALL
USING (true)
WITH CHECK (true);

-- INSCRIÇÕES
DROP POLICY IF EXISTS "Permitir tudo em inscricoes" ON inscricoes;
CREATE POLICY "Permitir tudo em inscricoes"
ON inscricoes
FOR ALL
USING (true)
WITH CHECK (true);

-- MUNICÍPIOS (apenas leitura, já que são dados fixos)
DROP POLICY IF EXISTS "Permitir leitura em municipios" ON municipios;
CREATE POLICY "Permitir leitura em municipios"
ON municipios
FOR SELECT
USING (true);

-- Verificar políticas criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

SELECT '✅ Políticas RLS criadas com sucesso!' as mensagem;

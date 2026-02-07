-- CORREÇÃO DE PERMISSÕES (RLS) PARA PESSOAS
-- Execute isso para permitir que o usuário logado cadastre os dados do esposo/esposa

-- 1. Habilitar RLS (caso não esteja)
ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas restritivas (se houver)
DROP POLICY IF EXISTS "Permitir insert pessoas" ON pessoas;
DROP POLICY IF EXISTS "Permitir update pessoas" ON pessoas;
DROP POLICY IF EXISTS "Permitir select pessoas" ON pessoas;
DROP POLICY IF EXISTS "Permitir tudo em pessoas" ON pessoas; -- Remove a policy antiga de dev

-- 3. Criar novas políticas permissivas para usuários AUTENTICADOS
-- Nota: Em um cenário ideal, vincularíamos a pessoa ao user_id também, 
-- mas como a tabela pessoas é global (pode ser usada por varios users), 
-- vamos permitir insert/select para authenticated users por enquanto.

CREATE POLICY "Permitir Insert Pessoas Authenticated"
ON pessoas FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir Update Pessoas Authenticated"
ON pessoas FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Permitir Select Pessoas Authenticated"
ON pessoas FOR SELECT
TO authenticated
USING (true);

-- Garante que Anonimo (não logado) não faça nada se sua app for fechada
-- Se sua app permitir checagem de CPF antes do login, precisaria liberar SELECT para anon também.

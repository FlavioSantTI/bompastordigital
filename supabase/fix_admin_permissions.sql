-- GARANTIR PERMISSÕES TOTAIS PARA ADMIN NA TABELA INSCRICOES
-- Para corrigir o problema de status não atualizando ao enviar comprovante

-- 1. Remover políticas antigas de update que podem estar restritivas
DROP POLICY IF EXISTS "Admin Update Inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Admin Delete Inscricoes" ON inscricoes;

-- 2. Criar política permissiva para Admin (UPDATE)
CREATE POLICY "Admin Update Inscricoes"
ON inscricoes
FOR UPDATE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 3. Criar política permissiva para Admin (DELETE)
CREATE POLICY "Admin Delete Inscricoes"
ON inscricoes
FOR DELETE
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 4. Garantir que a política de SELECT também inclua admin (caso já não tenha)
-- A política "Ver inscricoes" já deve cobrir isso, mas por garantia:
-- (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'

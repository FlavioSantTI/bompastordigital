-- 1. Adicionar a coluna que vincula a inscrição ao Usuário de Login
ALTER TABLE inscricoes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Atualizar a Política de Segurança (RLS)
ALTER TABLE inscricoes FORCE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir tudo em inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Ver inscricoes" ON inscricoes;
DROP POLICY IF EXISTS "Criar inscricao" ON inscricoes;
DROP POLICY IF EXISTS "Editar inscricao" ON inscricoes;

-- VISUALIZAR: Dono vê a sua, Admin vê todas
CREATE POLICY "Ver inscricoes" ON inscricoes
    FOR SELECT
    USING (
        auth.uid() = user_id 
        OR 
        (SELECT (raw_user_meta_data->>'role') FROM auth.users WHERE id = auth.uid()) = 'admin'
    );

-- INSERIR: Usuário só pode inserir se o user_id for ele mesmo
CREATE POLICY "Criar inscricao" ON inscricoes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ATUALIZAR: Apenas o dono pode editar sua inscrição
CREATE POLICY "Editar inscricao" ON inscricoes
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 3. Habilitar inserção para usuários autenticados (para criar a primeira inscrição)
-- A policy 'Criar inscricao' acima já cobre isso, mas precisamos garantir que o insert inclua o user_id correto.

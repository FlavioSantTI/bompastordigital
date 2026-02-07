-- CORREÇÃO CRÍTICA DE RLS
-- Substitui a leitura direta da tabela auth.users (proibida) pela leitura do JWT (permitida)

DROP POLICY IF EXISTS "Ver inscricoes" ON inscricoes;

CREATE POLICY "Ver inscricoes" ON inscricoes
    FOR SELECT
    USING (
        -- O usuário pode ver se ele for o dono do registro
        auth.uid() = user_id 
        OR 
        -- OU se ele tiver o papel de admin (lido do token, não da tabela)
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    );

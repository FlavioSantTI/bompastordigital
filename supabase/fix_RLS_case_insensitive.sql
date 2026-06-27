-- ==============================================================================
-- CORREÇÃO DE RLS: COMPATIBILIDADE CASE-INSENSITIVE E ACESSO DE CÔNJUGES
-- ==============================================================================

-- 1. CORREÇÃO DA POLÍTICA DE LEITURA EM INSCRIÇÕES (Permitir que ambos os cônjuges vejam)
DROP POLICY IF EXISTS "Ver inscricoes" ON inscricoes;

CREATE POLICY "Ver inscricoes" ON inscricoes
    FOR SELECT
    USING (
        -- O usuário pode ver se ele for o dono do registro (quem criou a inscrição)
        auth.uid() = user_id 
        OR 
        -- OU se ele tiver o papel de admin (lido do token)
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
        OR
        -- OU se o email dele corresponde ao esposo ou esposa desta inscrição (case-insensitive)
        EXISTS (
            SELECT 1 FROM pessoas p
            WHERE p.id IN (esposo_id, esposa_id)
              AND LOWER(p.email) = LOWER(auth.jwt() ->> 'email')
        )
    );

-- 2. CORREÇÃO DAS POLÍTICAS DE EQUIPE_TAREFAS PARA CHEFES/SUBCHEFES (Case-Insensitive)

-- Chefe/Subchefe insere tarefas
DROP POLICY IF EXISTS "Chefe/Subchefe insere tarefas" ON equipe_tarefas;
CREATE POLICY "Chefe/Subchefe insere tarefas"
ON equipe_tarefas FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM equipe_membros em
        JOIN cargos_equipe ce ON ce.id = em.cargo_id
        JOIN pessoas p ON p.id = em.pessoa_id
        WHERE em.equipe_id = equipe_tarefas.equipe_id
          AND LOWER(p.email) = LOWER(auth.jwt() ->> 'email')
          AND ce.nivel <= 2
    )
);

-- Chefe/Subchefe atualiza tarefas
DROP POLICY IF EXISTS "Chefe/Subchefe atualiza tarefas" ON equipe_tarefas;
CREATE POLICY "Chefe/Subchefe atualiza tarefas"
ON equipe_tarefas FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM equipe_membros em
        JOIN cargos_equipe ce ON ce.id = em.cargo_id
        JOIN pessoas p ON p.id = em.pessoa_id
        WHERE em.equipe_id = equipe_tarefas.equipe_id
          AND LOWER(p.email) = LOWER(auth.jwt() ->> 'email')
          AND ce.nivel <= 2
    )
);

-- Chefe/Subchefe exclui tarefas
DROP POLICY IF EXISTS "Chefe/Subchefe exclui tarefas" ON equipe_tarefas;
CREATE POLICY "Chefe/Subchefe exclui tarefas"
ON equipe_tarefas FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM equipe_membros em
        JOIN cargos_equipe ce ON ce.id = em.cargo_id
        JOIN pessoas p ON p.id = em.pessoa_id
        WHERE em.equipe_id = equipe_tarefas.equipe_id
          AND LOWER(p.email) = LOWER(auth.jwt() ->> 'email')
          AND ce.nivel <= 2
    )
);

SELECT '✅ Políticas RLS de Inscrições e Equipes atualizadas com sucesso!' as status;

-- ================================================================
-- FASE 4.0: GERENCIAMENTO DE EQUIPES DE EVENTO
-- Projeto: Bom Pastor Digital
-- Data: 01/05/2026
-- Descrição: Cria estrutura completa para gestão de equipes,
--            membros (chefe/subchefe/componente) e tarefas.
-- ================================================================

-- ========================================
-- 1. TABELA AUXILIAR: CARGOS DE EQUIPE
-- ========================================
CREATE TABLE IF NOT EXISTS cargos_equipe (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    nivel INTEGER NOT NULL DEFAULT 0,       -- Hierarquia: 1=Chefe, 2=Subchefe, 3=Componente
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cargos_equipe IS 'Tabela auxiliar de cargos para equipes. Extensível sem alteração de schema.';

-- Seed: Cargos padrão
INSERT INTO cargos_equipe (nome, descricao, nivel) VALUES
    ('Chefe', 'Responsável principal pela equipe', 1),
    ('Subchefe', 'Vice-responsável pela equipe', 2),
    ('Componente', 'Membro regular da equipe', 3)
ON CONFLICT (nome) DO NOTHING;

-- ========================================
-- 2. TABELA: EQUIPES
-- ========================================
CREATE TABLE IF NOT EXISTS equipes (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    cor VARCHAR(7),                          -- Cor hex (#RRGGBB) para identificação visual
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_equipe_evento UNIQUE (evento_id, nome)
);

COMMENT ON TABLE equipes IS 'Equipes de trabalho vinculadas a um evento específico.';

-- ========================================
-- 3. TABELA: MEMBROS DAS EQUIPES
-- ========================================
CREATE TABLE IF NOT EXISTS equipe_membros (
    id SERIAL PRIMARY KEY,
    equipe_id INTEGER NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    pessoa_id UUID NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
    cargo_id INTEGER NOT NULL REFERENCES cargos_equipe(id),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Uma pessoa não pode estar na mesma equipe duas vezes
    CONSTRAINT unique_membro_equipe UNIQUE (equipe_id, pessoa_id)
);

COMMENT ON TABLE equipe_membros IS 'Vincula pessoas a equipes com um cargo específico (chefe, subchefe, componente).';

-- ========================================
-- 4. TABELA: TAREFAS DAS EQUIPES
-- ========================================
CREATE TABLE IF NOT EXISTS equipe_tarefas (
    id SERIAL PRIMARY KEY,
    equipe_id INTEGER NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente',    -- pendente, em_andamento, concluida
    prioridade VARCHAR(10) NOT NULL DEFAULT 'media',   -- baixa, media, alta
    data_limite DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE equipe_tarefas IS 'Tarefas atribuídas a uma equipe com status e prioridade.';

-- ========================================
-- 5. ÍNDICES DE PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_equipes_evento ON equipes(evento_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_equipe ON equipe_membros(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_pessoa ON equipe_membros(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_equipe_membros_cargo ON equipe_membros(cargo_id);
CREATE INDEX IF NOT EXISTS idx_equipe_tarefas_equipe ON equipe_tarefas(equipe_id);
CREATE INDEX IF NOT EXISTS idx_equipe_tarefas_status ON equipe_tarefas(status);

-- ========================================
-- 6. HABILITAR ROW LEVEL SECURITY
-- ========================================
ALTER TABLE cargos_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_membros ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipe_tarefas ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 7. POLÍTICAS RLS
-- ========================================
-- Nota: Seguindo o padrão do projeto, políticas permissivas para
-- desenvolvimento. Para produção, substituir por políticas restritivas
-- com verificação de role admin e cargo do membro.

-- CARGOS_EQUIPE (leitura para todos autenticados, é tabela de lookup)
DROP POLICY IF EXISTS "Permitir leitura cargos_equipe" ON cargos_equipe;
CREATE POLICY "Permitir leitura cargos_equipe"
ON cargos_equipe FOR SELECT
TO authenticated
USING (true);

-- Admin pode gerenciar cargos (futuro CRUD)
DROP POLICY IF EXISTS "Admin gerencia cargos_equipe" ON cargos_equipe;
CREATE POLICY "Admin gerencia cargos_equipe"
ON cargos_equipe FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- EQUIPES (leitura para todos autenticados, escrita para admin)
DROP POLICY IF EXISTS "Permitir leitura equipes" ON equipes;
CREATE POLICY "Permitir leitura equipes"
ON equipes FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin gerencia equipes" ON equipes;
CREATE POLICY "Admin gerencia equipes"
ON equipes FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- EQUIPE_MEMBROS (leitura para todos autenticados, escrita para admin)
DROP POLICY IF EXISTS "Permitir leitura equipe_membros" ON equipe_membros;
CREATE POLICY "Permitir leitura equipe_membros"
ON equipe_membros FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admin gerencia equipe_membros" ON equipe_membros;
CREATE POLICY "Admin gerencia equipe_membros"
ON equipe_membros FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- EQUIPE_TAREFAS (leitura para membros, escrita para admin + chefe/subchefe)
DROP POLICY IF EXISTS "Permitir leitura equipe_tarefas" ON equipe_tarefas;
CREATE POLICY "Permitir leitura equipe_tarefas"
ON equipe_tarefas FOR SELECT
TO authenticated
USING (true);

-- Admin: CRUD completo em tarefas
DROP POLICY IF EXISTS "Admin gerencia equipe_tarefas" ON equipe_tarefas;
CREATE POLICY "Admin gerencia equipe_tarefas"
ON equipe_tarefas FOR ALL
TO authenticated
USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Chefe/Subchefe: podem INSERT tarefas na sua equipe
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
          AND p.email = auth.jwt() ->> 'email'
          AND ce.nivel <= 2
    )
);

-- Chefe/Subchefe: podem UPDATE tarefas da sua equipe
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
          AND p.email = auth.jwt() ->> 'email'
          AND ce.nivel <= 2
    )
);

-- Chefe/Subchefe: podem DELETE tarefas da sua equipe
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
          AND p.email = auth.jwt() ->> 'email'
          AND ce.nivel <= 2
    )
);

-- ========================================
-- 8. VERIFICAÇÃO
-- ========================================
SELECT '✅ Tabelas de equipes criadas com sucesso!' as status;

-- Verificar tabelas
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('cargos_equipe', 'equipes', 'equipe_membros', 'equipe_tarefas')
ORDER BY tablename;

-- Verificar seed de cargos
SELECT id, nome, nivel FROM cargos_equipe ORDER BY nivel;

-- Verificar políticas
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('cargos_equipe', 'equipes', 'equipe_membros', 'equipe_tarefas')
ORDER BY tablename, policyname;

SELECT '✅ Fase 4.0 — Schema de equipes pronto para uso!' as status;

-- ==============================================================================
-- MIGRAÇÃO: Períodos de Inscrição e Realização de Eventos
-- PRD: Períodos de Evento v1.0 (Bom Pastor Digital v5.2)
-- Data: 27/06/2026
-- 
-- Este script deve ser executado em ETAPAS no Supabase SQL Editor.
-- Recomenda-se executar cada etapa separadamente e validar antes de prosseguir.
-- ==============================================================================

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ ETAPA 1: Adicionar novos campos (nullable temporariamente)                 ║
-- ║ RISCO: BAIXO — Apenas adiciona colunas, não altera dados existentes        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE eventos
  ADD COLUMN IF NOT EXISTS inscricao_inicio  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inscricao_fim     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS realizacao_inicio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS realizacao_fim    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS publicado         BOOLEAN NOT NULL DEFAULT false;

SELECT '✅ ETAPA 1 concluída — Campos de período adicionados (nullable).' AS resultado;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ ETAPA 2: Migrar dados existentes                                           ║
-- ║ Estratégia:                                                                ║
-- ║   data_inicio + hora_inicio → realizacao_inicio                            ║
-- ║   data_fim + hora_fim → realizacao_fim                                     ║
-- ║   inscricao_inicio = realizacao_inicio - 30 dias                           ║
-- ║   inscricao_fim = realizacao_inicio - 3 dias                               ║
-- ║   publicado = true se status IN ('aberto','em_andamento')                  ║
-- ║ RISCO: MÉDIO — Modifica dados, mas campos novos (não afeta legados)        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

UPDATE eventos SET
  realizacao_inicio = (data_inicio::date + COALESCE(hora_inicio, '08:00'::time))::timestamptz,
  realizacao_fim    = (data_fim::date    + COALESCE(hora_fim, '18:00'::time))::timestamptz,
  inscricao_inicio  = (data_inicio::date + COALESCE(hora_inicio, '08:00'::time) - INTERVAL '30 days')::timestamptz,
  inscricao_fim     = (data_inicio::date + COALESCE(hora_inicio, '08:00'::time) - INTERVAL '3 days')::timestamptz,
  publicado         = CASE 
                        WHEN status IN ('aberto', 'em_andamento') THEN true 
                        ELSE false 
                      END
WHERE inscricao_inicio IS NULL;

SELECT '✅ ETAPA 2 concluída — Dados migrados.' AS resultado;

-- Verificar migração
SELECT id, nome,
       inscricao_inicio, inscricao_fim,
       realizacao_inicio, realizacao_fim,
       publicado, status,
       data_inicio, data_fim
FROM eventos
ORDER BY id;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ ETAPA 3: Renomear status → status_manual                                  ║
-- ║ RISCO: MÉDIO — Renomeia coluna, frontend deve ser atualizado               ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE eventos RENAME COLUMN status TO status_manual;

SELECT '✅ ETAPA 3 concluída — Coluna status renomeada para status_manual.' AS resultado;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ ETAPA 4: Adicionar NOT NULL e constraint de validação                      ║
-- ║ RISCO: ALTO — Se houver dados inconsistentes, esta etapa falhará.          ║
-- ║ EXECUTAR SOMENTE APÓS VALIDAR ETAPA 2.                                    ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

ALTER TABLE eventos
  ALTER COLUMN inscricao_inicio SET NOT NULL,
  ALTER COLUMN inscricao_fim SET NOT NULL,
  ALTER COLUMN realizacao_inicio SET NOT NULL,
  ALTER COLUMN realizacao_fim SET NOT NULL;

-- Constraint: Validar ordem cronológica estrita
-- inscricao_inicio < inscricao_fim < realizacao_inicio < realizacao_fim
ALTER TABLE eventos ADD CONSTRAINT chk_periodos_evento CHECK (
  inscricao_inicio < inscricao_fim
  AND inscricao_fim < realizacao_inicio
  AND realizacao_inicio < realizacao_fim
);

SELECT '✅ ETAPA 4 concluída — NOT NULL e constraint adicionados.' AS resultado;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ ETAPA 5: Criar índices para performance                                    ║
-- ║ RISCO: BAIXO — Apenas índices, melhora consultas                           ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

CREATE INDEX IF NOT EXISTS idx_eventos_inscricao_inicio ON eventos(inscricao_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_inscricao_fim ON eventos(inscricao_fim);
CREATE INDEX IF NOT EXISTS idx_eventos_realizacao_inicio ON eventos(realizacao_inicio);
CREATE INDEX IF NOT EXISTS idx_eventos_realizacao_fim ON eventos(realizacao_fim);
CREATE INDEX IF NOT EXISTS idx_eventos_publicado ON eventos(publicado);

SELECT '✅ ETAPA 5 concluída — Índices criados.' AS resultado;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ ETAPA 6: Depreciar campos antigos (NÃO remove, apenas marca)              ║
-- ║ RISCO: NENHUM — Apenas comentários                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

COMMENT ON COLUMN eventos.data_inicio IS 'DEPRECATED v5.2 — usar realizacao_inicio (TIMESTAMPTZ)';
COMMENT ON COLUMN eventos.data_fim IS 'DEPRECATED v5.2 — usar realizacao_fim (TIMESTAMPTZ)';
COMMENT ON COLUMN eventos.hora_inicio IS 'DEPRECATED v5.2 — usar realizacao_inicio (TIMESTAMPTZ)';
COMMENT ON COLUMN eventos.hora_fim IS 'DEPRECATED v5.2 — usar realizacao_fim (TIMESTAMPTZ)';

SELECT '✅ ETAPA 6 concluída — Campos antigos depreciados.' AS resultado;

-- ╔══════════════════════════════════════════════════════════════════════════════╗
-- ║ VERIFICAÇÃO FINAL                                                          ║
-- ╚══════════════════════════════════════════════════════════════════════════════╝

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'eventos'
ORDER BY ordinal_position;

SELECT '🎉 Migração de Períodos de Evento concluída com sucesso!' AS resultado;

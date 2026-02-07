-- ================================================================
-- CORREÇÃO: PERMISSÃO DE DELETE NA TABELA E NO STORAGE
-- ================================================================

-- 1. Permissão de DELETE na tabela comprovantes_inscricao
DROP POLICY IF EXISTS "Permitir exclusão de comprovantes" ON comprovantes_inscricao;

CREATE POLICY "Permitir exclusão de comprovantes"
ON comprovantes_inscricao FOR DELETE
USING (true);

-- 2. Garantir (novamente) permissão no Storage
DROP POLICY IF EXISTS "Permitir excluir comprovantes" ON storage.objects;

CREATE POLICY "Permitir excluir comprovantes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'comprovantes' );

SELECT '✅ Permissões de exclusão (Tabela + Storage) aplicadas com sucesso!' as resultado;

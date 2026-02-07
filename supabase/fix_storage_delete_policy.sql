-- ================================================================
-- CORREÇÃO: PERMISSÃO DE EXCLUSÃO NO STORAGE
-- ================================================================

-- Habilitar política de DELETE para o bucket 'comprovantes'
-- ATENÇÃO: Em produção, você deve restringir isso apenas para admins autenticados.
-- Como estamos em dev/teste, vamos permitir para facilitar.

DROP POLICY IF EXISTS "Permitir excluir comprovantes" ON storage.objects;

CREATE POLICY "Permitir excluir comprovantes"
ON storage.objects FOR DELETE
USING ( bucket_id = 'comprovantes' );

-- Adicionar política de UPDATE também, só por precaução (embora não usada agora)
DROP POLICY IF EXISTS "Permitir atualizar comprovantes" ON storage.objects;

CREATE POLICY "Permitir atualizar comprovantes"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'comprovantes' );

SELECT '✅ Permissões de exclusão no Storage configuradas!' as resultado;

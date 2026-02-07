-- SCRIPT PARA GERENCIAR USUÁRIOS E PERMISSÕES (SQL Editor do Supabase)

-- 1. Promoção de um email existente para ADMIN
-- Troque 'seu.email@exemplo.com' pelo email que você cadastrou no site
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@bompastor.com'; -- Coloque seu email aqui



-- 2. (Opcional) Confirmar o email manualmente (se estiver preso na verificação)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@bompastor.com'; -- Coloque seu email aqui



-- DICA DE OURO PARA DESENVOLVIMENTO:
-- Se quiser desabilitar a confirmação de email para todos os NOVOS usuários:
-- Vá em Authentication -> Providers -> Email -> Desmarque "Confirm email"

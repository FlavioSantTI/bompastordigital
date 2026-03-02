-- Função RPC para listar Usuários Seguramente
-- Exige que o JWT Role possua metadado de "admin"

CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    role VARCHAR,
    nome VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER 
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- 1. Verifica se o usuário que está chamando a request é um admin 
    -- lendo da metadata bruta injetada no Auth Server.
    IF NOT EXISTS (
        SELECT 1
        FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND COALESCE(auth.users.raw_user_meta_data->>'role', '') = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso Negado: Privilégios de Administrador são necessários para leitura.';
    END IF;

    -- 2. Retorna a lista extraindo o básico necessário para o frontend Grid
    RETURN QUERY
    SELECT 
        u.id,
        u.email::VARCHAR,
        (u.raw_user_meta_data->>'role')::VARCHAR as role,
        (u.raw_user_meta_data->>'nome')::VARCHAR as nome,
        u.created_at,
        u.last_sign_in_at
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$;

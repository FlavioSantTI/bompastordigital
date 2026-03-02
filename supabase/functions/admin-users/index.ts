import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Instancia o cliente admin (já faz tudo direto no banco)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )

    // 2. Extrai o token de quem fez a request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Header de autorização ausente');
    }

    // 3. Verifica no backend se quem mandou o token tem role 'admin'
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Falha ao autenticar o usuário ou token expirou: ' + userError?.message);
    }

    if (user.user_metadata?.role !== 'admin') {
      throw new Error('Acesso Negado: Privilégios de Administrador são necessários');
    }

    const { action, payload } = await req.json()
    let result;

    switch (action) {
      case 'createUser': {
        const { email, password, role, nome } = payload;
        const res = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirmação para agilizar caso desejem
          user_metadata: { role: role || 'usuario', nome: nome || '' }
        });
        if (res.error) throw res.error;
        result = res.data.user;
        break;
      }

      case 'updateUser': {
        const { uid, email, password, role, nome } = payload;
        const updates: any = {};
        if (email) updates.email = email;
        if (password) updates.password = password;
        if (role || nome) {
          // Busca metadata atual para não sobrescrever caso não passe tudo
          const { data: currentUser } = await supabaseAdmin.auth.admin.getUserById(uid);
          const currentMeta = currentUser?.user?.user_metadata || {};

          updates.user_metadata = {
            ...currentMeta,
            ...(role ? { role } : {}),
            ...(nome ? { nome } : {})
          };
        }

        const res = await supabaseAdmin.auth.admin.updateUserById(uid, updates);
        if (res.error) throw res.error;
        result = res.data.user;
        break;
      }

      case 'deleteUser': {
        const { uid } = payload;
        const res = await supabaseAdmin.auth.admin.deleteUser(uid);
        if (res.error) throw res.error;
        result = { success: true };
        break;
      }

      default:
        throw new Error('Ação não suportada. Use: createUser, updateUser, deleteUser');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Erro Desconhecido' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  }
})

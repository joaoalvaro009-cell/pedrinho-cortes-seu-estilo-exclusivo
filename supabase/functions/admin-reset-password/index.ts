// Edge function que permite redefinir a senha de uma conta admin existente
// SEM precisar de e-mail de recuperação. Só funciona se o e-mail informado
// pertence a um usuário com role 'admin'.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, newPassword } = await req.json();

    if (!email || !newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Procura o usuário pelo e-mail
    let targetUserId: string | null = null;
    let page = 1;
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const found = data.users.find((u) => u.email?.toLowerCase() === String(email).toLowerCase());
      if (found) { targetUserId = found.id; break; }
      if (data.users.length < 1000) break;
      page++;
    }

    if (!targetUserId) {
      return new Response(JSON.stringify({ error: "Conta não encontrada." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verifica que é admin
    const { data: roles, error: rolesErr } = await admin
      .from("user_roles").select("role").eq("user_id", targetUserId).eq("role", "admin");
    if (rolesErr) throw rolesErr;
    if (!roles || roles.length === 0) {
      return new Response(JSON.stringify({ error: "Esta conta não é admin." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atualiza a senha
    const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, {
      password: newPassword,
      email_confirm: true,
    });
    if (updErr) throw updErr;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

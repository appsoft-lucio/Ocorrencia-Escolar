import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Metodo nao permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return jsonResponse({ error: "Ambiente Supabase incompleto." }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return jsonResponse({ error: "Sessao nao informada." }, 401);
  }

  const supabaseAuth = createClient(supabaseUrl, anonKey, {
    global: {
      headers: { Authorization: authHeader },
    },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);

  if (authError || !authData.user) {
    return jsonResponse({ error: "Sessao invalida." }, 401);
  }

  const { data: perfilAtual, error: perfilError } = await supabaseAdmin
    .from("perfis")
    .select("id, perfil, status")
    .eq("id", authData.user.id)
    .single();

  if (
    perfilError ||
    !perfilAtual ||
    perfilAtual.status !== "ativo" ||
    perfilAtual.perfil !== "desenvolvedor"
  ) {
    return jsonResponse({ error: "Apenas desenvolvedor pode excluir escola." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const escolaId = body.id?.toString().trim();

  if (!escolaId) {
    return jsonResponse({ error: "Informe a escola." }, 400);
  }

  const { data: perfis, error: perfisError } = await supabaseAdmin
    .from("perfis")
    .select("id")
    .eq("escola_id", escolaId);

  if (perfisError) {
    return jsonResponse(
      { error: perfisError.message || "Nao foi possivel carregar usuarios da escola." },
      400,
    );
  }

  for (const perfil of perfis || []) {
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(
      perfil.id,
    );

    if (deleteUserError) {
      return jsonResponse(
        { error: deleteUserError.message || "Nao foi possivel excluir usuarios." },
        400,
      );
    }
  }

  const { error: deleteEscolaError } = await supabaseAdmin
    .from("escolas")
    .delete()
    .eq("id", escolaId);

  if (deleteEscolaError) {
    return jsonResponse(
      { error: deleteEscolaError.message || "Nao foi possivel excluir a escola." },
      400,
    );
  }

  return jsonResponse({ ok: true });
});

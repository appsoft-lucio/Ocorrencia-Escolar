import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PERFIS_GERENCIAVEIS: Record<string, string[]> = {
  diretor: ["vice_diretor", "coordenador", "professor"],
  vice_diretor: ["coordenador", "professor"],
  coordenador: ["professor"],
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

function normalizarTexto(valor = "") {
  return valor.toString().trim();
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
    .select("id, escola_id, perfil, status")
    .eq("id", authData.user.id)
    .single();

  if (perfilError || !perfilAtual || perfilAtual.status !== "ativo") {
    return jsonResponse({ error: "Perfil sem permissao." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const nome = normalizarTexto(body.nome);
  const email = normalizarTexto(body.email).toLowerCase();
  const senha = normalizarTexto(body.senha);
  const perfil = normalizarTexto(body.perfil);
  const whatsapp = normalizarTexto(body.whatsapp);
  const status = body.status === "inativo" ? "inativo" : "ativo";
  const escolaId = perfilAtual.escola_id;
  const perfisPermitidos = PERFIS_GERENCIAVEIS[perfilAtual.perfil] || [];

  if (!nome || !email || !senha || !perfil) {
    return jsonResponse({ error: "Informe nome, email, senha e perfil." }, 400);
  }

  if (!escolaId) {
    return jsonResponse({ error: "Usuario atual sem escola vinculada." }, 403);
  }

  if (!perfisPermitidos.includes(perfil)) {
    return jsonResponse({ error: "Perfil nao permitido para seu cargo." }, 403);
  }

  const { data: usuarioCriado, error: criarUsuarioError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        perfil,
        escola_id: escolaId,
      },
    });

  if (criarUsuarioError || !usuarioCriado.user) {
    return jsonResponse(
      { error: criarUsuarioError?.message || "Nao foi possivel criar o login." },
      400,
    );
  }

  const { data: perfilCriado, error: criarPerfilError } = await supabaseAdmin
    .from("perfis")
    .insert({
      id: usuarioCriado.user.id,
      escola_id: escolaId,
      nome,
      perfil,
      whatsapp,
      status,
    })
    .select("id, escola_id, nome, perfil, whatsapp, status, created_at, updated_at")
    .single();

  if (criarPerfilError) {
    await supabaseAdmin.auth.admin.deleteUser(usuarioCriado.user.id);
    return jsonResponse(
      { error: criarPerfilError.message || "Nao foi possivel criar o perfil." },
      400,
    );
  }

  return jsonResponse({ usuario: perfilCriado }, 201);
});

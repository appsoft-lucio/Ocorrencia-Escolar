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

function gerarAuthEmail(login: string) {
  const usuario = login
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${usuario || "usuario"}@login.ocorrencia-escolar.local`;
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
  const login = normalizarTexto(body.login).toLowerCase();
  const email = normalizarTexto(body.email).toLowerCase();
  const authEmail = gerarAuthEmail(login);
  const senha = normalizarTexto(body.senha);
  const perfil = normalizarTexto(body.perfil);
  const whatsapp = normalizarTexto(body.whatsapp);
  const disciplina = normalizarTexto(body.disciplina);
  const turno = normalizarTexto(body.turno);
  const turmas = Array.isArray(body.turmas)
    ? body.turmas.map((turma) => normalizarTexto(turma)).filter(Boolean)
    : [];
  const status = body.status === "inativo" ? "inativo" : "ativo";
  const escolaId = perfilAtual.escola_id;
  const perfisPermitidos = PERFIS_GERENCIAVEIS[perfilAtual.perfil] || [];

  if (!nome || !login || !email || !senha || !perfil) {
    return jsonResponse(
      { error: "Informe nome, usuario, email, senha e perfil." },
      400,
    );
  }

  if (!escolaId) {
    return jsonResponse({ error: "Usuario atual sem escola vinculada." }, 403);
  }

  if (!perfisPermitidos.includes(perfil)) {
    return jsonResponse({ error: "Perfil nao permitido para seu cargo." }, 403);
  }

  const { data: loginExistente, error: loginError } = await supabaseAdmin
    .from("perfis")
    .select("id")
    .eq("login", login)
    .maybeSingle();

  if (loginError) {
    return jsonResponse({ error: "Nao foi possivel validar o usuario." }, 400);
  }

  if (loginExistente) {
    return jsonResponse({ error: "Este usuario ja esta em uso." }, 400);
  }

  const { data: usuarioCriado, error: criarUsuarioError } =
    await supabaseAdmin.auth.admin.createUser({
      email: authEmail,
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome,
        login,
        email,
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
      login,
      email,
      auth_email: authEmail,
      perfil,
      whatsapp,
      disciplina: perfil === "professor" ? disciplina : null,
      turno: perfil === "professor" ? turno : null,
      turmas: perfil === "professor" ? turmas : [],
      status,
    })
    .select("id, escola_id, nome, perfil, login, email, whatsapp, disciplina, turno, turmas, status, created_at, updated_at")
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

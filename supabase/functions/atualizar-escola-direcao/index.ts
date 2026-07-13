import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
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
    global: { headers: { Authorization: authHeader } },
  });
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await supabaseAuth.auth.getUser(token);

  if (authError || !authData.user) {
    return jsonResponse({ error: "Sessao invalida." }, 401);
  }

  const { data: perfilAtual, error: perfilAtualError } = await supabaseAdmin
    .from("perfis")
    .select("id, perfil, status")
    .eq("id", authData.user.id)
    .single();

  if (
    perfilAtualError ||
    !perfilAtual ||
    perfilAtual.status !== "ativo" ||
    perfilAtual.perfil !== "desenvolvedor"
  ) {
    return jsonResponse({ error: "Apenas desenvolvedor pode atualizar escola." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const id = normalizarTexto(body.id);
  const nomeEscola = normalizarTexto(body.nome);
  const cidade = normalizarTexto(body.cidade);
  const diretorNome = normalizarTexto(body.diretorNome);
  const diretorLogin = normalizarTexto(body.diretorLogin).toLowerCase();
  const diretorEmail = normalizarTexto(body.diretorEmail).toLowerCase();
  const diretorTelefone = normalizarTexto(body.diretorTelefone);
  const diretorSenha = normalizarTexto(body.diretorSenha);
  const diretorAuthEmail = gerarAuthEmail(diretorLogin);
  const status = body.status === "inativo" ? "inativo" : "ativo";
  const permitirImportacaoAlunos = body.permitirImportacaoAlunos === true;

  if (!id || !nomeEscola || !diretorNome || !diretorLogin || !diretorEmail || !diretorTelefone) {
    return jsonResponse(
      { error: "Informe escola, nome, usuario, email e WhatsApp da direcao." },
      400,
    );
  }

  if (diretorSenha && diretorSenha.length < 6) {
    return jsonResponse(
      { error: "A senha da direcao deve ter pelo menos 6 caracteres." },
      400,
    );
  }

  const { data: diretor, error: diretorError } = await supabaseAdmin
    .from("perfis")
    .select("id, login, auth_email")
    .eq("escola_id", id)
    .eq("perfil", "diretor")
    .maybeSingle();

  if (diretorError || !diretor) {
    return jsonResponse({ error: "Diretor da escola nao encontrado." }, 404);
  }

  const { data: loginExistente, error: loginError } = await supabaseAdmin
    .from("perfis")
    .select("id")
    .ilike("login", diretorLogin)
    .neq("id", diretor.id)
    .maybeSingle();

  if (loginError) {
    return jsonResponse({ error: "Nao foi possivel validar o usuario." }, 400);
  }

  if (loginExistente) {
    return jsonResponse({ error: "Este usuario ja esta em uso." }, 400);
  }

  const authUpdates: { email: string; password?: string; user_metadata: Record<string, string> } = {
    email: diretorAuthEmail,
    user_metadata: {
      nome: diretorNome,
      login: diretorLogin,
      email: diretorEmail,
      whatsapp: diretorTelefone,
      perfil: "diretor",
      escola_id: id,
    },
  };

  if (diretorSenha) {
    authUpdates.password = diretorSenha;
  }

  const { error: atualizarAuthError } = await supabaseAdmin.auth.admin.updateUserById(
    diretor.id,
    authUpdates,
  );

  if (atualizarAuthError) {
    return jsonResponse(
      { error: atualizarAuthError.message || "Nao foi possivel atualizar o acesso da direcao." },
      400,
    );
  }

  const { data: escola, error: escolaError } = await supabaseAdmin
    .from("escolas")
    .update({
      nome: nomeEscola,
      cidade,
      status,
      permitir_importacao_alunos: permitirImportacaoAlunos,
    })
    .eq("id", id)
    .select("id, nome, cidade, status, created_at, updated_at")
    .single();

  const { error: perfilError } = await supabaseAdmin
    .from("perfis")
    .update({
      nome: diretorNome,
      login: diretorLogin,
      email: diretorEmail,
      auth_email: diretorAuthEmail,
      whatsapp: diretorTelefone,
    })
    .eq("id", diretor.id);

  if (escolaError || perfilError || !escola) {
    return jsonResponse(
      { error: "O acesso foi atualizado, mas nao foi possivel concluir os dados da escola." },
      500,
    );
  }

  return jsonResponse({
    escola: {
      ...escola,
      diretorNome,
      diretorLogin,
      diretorEmail,
      diretorTelefone,
      permitirImportacaoAlunos,
    },
  });
});

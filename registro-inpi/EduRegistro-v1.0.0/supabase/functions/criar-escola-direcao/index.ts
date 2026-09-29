import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIPOS_OCORRENCIA_PADRAO = [
  "Indisciplina",
  "Atraso",
  "Falta de material",
  "Desrespeito",
  "Agressão verbal",
  "Agressão física",
  "Briga",
  "Bullying",
  "Uso indevido de celular",
  "Saída da sala sem autorização",
  "Dano ao patrimônio",
  "Recusa em realizar atividade",
  "Outro",
];

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
    .select("id, perfil, status")
    .eq("id", authData.user.id)
    .single();

  if (
    perfilError ||
    !perfilAtual ||
    perfilAtual.status !== "ativo" ||
    perfilAtual.perfil !== "desenvolvedor"
  ) {
    return jsonResponse({ error: "Apenas desenvolvedor pode criar escola." }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const nomeEscola = normalizarTexto(body.nome);
  const cidade = normalizarTexto(body.cidade);
  const diretorNome = normalizarTexto(body.diretorNome);
  const diretorLogin = normalizarTexto(body.diretorLogin).toLowerCase();
  const diretorEmail = normalizarTexto(body.diretorEmail).toLowerCase();
  const diretorAuthEmail = gerarAuthEmail(diretorLogin);
  const diretorTelefone = normalizarTexto(body.diretorTelefone);
  const diretorSenha = normalizarTexto(body.diretorSenha);
  const status = body.status === "inativo" ? "inativo" : "ativo";
  const permitirImportacaoAlunos = body.permitirImportacaoAlunos === true;

  if (
    !nomeEscola ||
    !diretorNome ||
    !diretorLogin ||
    !diretorEmail ||
    !diretorTelefone ||
    !diretorSenha
  ) {
    return jsonResponse(
      { error: "Informe escola, nome, usuario, email, WhatsApp e senha da direcao." },
      400,
    );
  }

  if (diretorSenha.length < 6) {
    return jsonResponse(
      { error: "A senha da direcao deve ter pelo menos 6 caracteres." },
      400,
    );
  }

  const { data: loginExistente, error: loginError } = await supabaseAdmin
    .from("perfis")
    .select("id")
    .eq("login", diretorLogin)
    .maybeSingle();

  if (loginError) {
    return jsonResponse({ error: "Nao foi possivel validar o usuario." }, 400);
  }

  if (loginExistente) {
    return jsonResponse({ error: "Este usuario ja esta em uso." }, 400);
  }

  const { data: escolaCriada, error: criarEscolaError } = await supabaseAdmin
    .from("escolas")
    .insert({
      nome: nomeEscola,
      cidade,
      status,
      permitir_importacao_alunos: permitirImportacaoAlunos,
    })
    .select("id, nome, cidade, status, created_at, updated_at")
    .single();

  if (criarEscolaError || !escolaCriada) {
    return jsonResponse(
      { error: criarEscolaError?.message || "Nao foi possivel criar a escola." },
      400,
    );
  }

  const { error: tiposError } = await supabaseAdmin
    .from("tipos_ocorrencia")
    .insert(
      TIPOS_OCORRENCIA_PADRAO.map((nome) => ({
        escola_id: escolaCriada.id,
        nome,
        status: "ativo",
      })),
    );

  if (tiposError) {
    await supabaseAdmin.from("escolas").delete().eq("id", escolaCriada.id);
    return jsonResponse(
      { error: "Nao foi possivel criar os tipos de ocorrencia da escola." },
      400,
    );
  }

  const { data: usuarioCriado, error: criarUsuarioError } =
    await supabaseAdmin.auth.admin.createUser({
      email: diretorAuthEmail,
      password: diretorSenha,
      email_confirm: true,
      user_metadata: {
        nome: diretorNome,
        login: diretorLogin,
        email: diretorEmail,
        whatsapp: diretorTelefone,
        perfil: "diretor",
        escola_id: escolaCriada.id,
      },
    });

  if (criarUsuarioError || !usuarioCriado.user) {
    await supabaseAdmin.from("escolas").delete().eq("id", escolaCriada.id);
    return jsonResponse(
      {
        error:
          criarUsuarioError?.message || "Nao foi possivel criar o login da direcao.",
      },
      400,
    );
  }

  const { error: criarPerfilError } = await supabaseAdmin.from("perfis").insert({
    id: usuarioCriado.user.id,
    escola_id: escolaCriada.id,
    nome: diretorNome,
    login: diretorLogin,
    email: diretorEmail,
    auth_email: diretorAuthEmail,
    whatsapp: diretorTelefone,
    perfil: "diretor",
    status: "ativo",
  });

  if (criarPerfilError) {
    await supabaseAdmin.auth.admin.deleteUser(usuarioCriado.user.id);
    await supabaseAdmin.from("escolas").delete().eq("id", escolaCriada.id);
    return jsonResponse(
      { error: criarPerfilError.message || "Nao foi possivel criar o perfil." },
      400,
    );
  }

  return jsonResponse(
    {
      escola: {
        ...escolaCriada,
        permitirImportacaoAlunos,
        diretorNome,
        diretorLogin,
        diretorEmail,
        diretorTelefone,
      },
    },
    201,
  );
});

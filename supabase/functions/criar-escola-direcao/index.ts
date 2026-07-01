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
  const diretorEmail = normalizarTexto(body.diretorEmail).toLowerCase();
  const diretorTelefone = normalizarTexto(body.diretorTelefone);
  const diretorSenha = normalizarTexto(body.diretorSenha);
  const status = body.status === "inativo" ? "inativo" : "ativo";

  if (!nomeEscola || !diretorNome || !diretorEmail || !diretorTelefone || !diretorSenha) {
    return jsonResponse(
      { error: "Informe escola, nome, email, telefone e senha da direcao." },
      400,
    );
  }

  const { data: escolaCriada, error: criarEscolaError } = await supabaseAdmin
    .from("escolas")
    .insert({
      nome: nomeEscola,
      cidade,
      status,
    })
    .select("id, nome, cidade, status, created_at, updated_at")
    .single();

  if (criarEscolaError || !escolaCriada) {
    return jsonResponse(
      { error: criarEscolaError?.message || "Nao foi possivel criar a escola." },
      400,
    );
  }

  const { data: usuarioCriado, error: criarUsuarioError } =
    await supabaseAdmin.auth.admin.createUser({
      email: diretorEmail,
      password: diretorSenha,
      email_confirm: true,
      user_metadata: {
        nome: diretorNome,
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
    email: diretorEmail,
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
        diretorNome,
        diretorEmail,
        diretorTelefone,
        diretorLogin: diretorEmail,
      },
    },
    201,
  );
});

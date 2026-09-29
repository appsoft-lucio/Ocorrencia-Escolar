import { supabase } from "./supabaseClient";

function mapearPerfilUsuario(row) {
  return {
    chave: `${row.perfil}-${row.id}`,
    id: row.id,
    nome: row.nome,
    role: row.perfil,
    login: row.login || "",
    email: row.email || "",
    whatsapp: row.whatsapp || "",
    status: row.status || "ativo",
    escolaId: row.escola_id,
    criadoEm: row.created_at || null,
    atualizadoEm: row.updated_at || null,
    origem: "supabase",
  };
}

export async function listarUsuariosEscolaSupabase(user, perfisPermitidos = []) {
  if (!user?.escolaId) {
    throw new Error("Usuario sem escola vinculada.");
  }

  const { data, error } = await supabase
    .from("perfis")
    .select("id, escola_id, nome, perfil, login, email, whatsapp, status, created_at, updated_at")
    .eq("escola_id", user.escolaId)
    .in("perfil", perfisPermitidos)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar usuarios.");
  }

  return (data || []).map(mapearPerfilUsuario);
}

export async function criarUsuarioEscolaSupabase(dados) {
  const { data, error } = await supabase.functions.invoke("criar-usuario-escola", {
    body: dados,
  });

  if (error) {
    throw new Error(error.message || "Nao foi possivel criar o usuario.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return {
    ...mapearPerfilUsuario(data.usuario),
    email: dados.email,
    login: dados.login,
  };
}

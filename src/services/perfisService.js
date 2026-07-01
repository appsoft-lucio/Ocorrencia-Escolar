import { supabase } from "./supabaseClient";

export function mapearPerfilProfessor(row) {
  return {
    id: row.id,
    nome: row.nome,
    perfil: row.perfil,
    whatsapp: row.whatsapp || "",
    status: row.status || "ativo",
    escolaId: row.escola_id,
    criadoEm: row.created_at || null,
    atualizadoEm: row.updated_at || null,
  };
}

export async function listarProfessoresSupabase(escolaId) {
  let query = supabase
    .from("perfis")
    .select("id, escola_id, nome, perfil, whatsapp, status, created_at, updated_at")
    .eq("perfil", "professor")
    .order("nome", { ascending: true });

  if (escolaId) {
    query = query.eq("escola_id", escolaId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Nao foi possivel carregar professores.");
  }

  return (data || []).map(mapearPerfilProfessor);
}

export async function atualizarStatusPerfilSupabase(id, status) {
  const { data, error } = await supabase
    .from("perfis")
    .update({ status })
    .eq("id", id)
    .select("id, escola_id, nome, perfil, whatsapp, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o status do usuario.");
  }

  return mapearPerfilProfessor(data);
}

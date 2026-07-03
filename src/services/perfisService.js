import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";

const CAMPOS_PERFIL_PROFESSOR =
  "id, escola_id, nome, perfil, login, email, whatsapp, status, created_at, updated_at";

export function mapearPerfilProfessor(row) {
  return {
    id: row.id,
    nome: row.nome,
    perfil: row.perfil,
    login: row.login || "",
    email: row.email || "",
    whatsapp: row.whatsapp || "",
    status: row.status || "ativo",
    escolaId: row.escola_id,
    criadoEm: row.created_at || null,
    atualizadoEm: row.updated_at || null,
  };
}

function validarUsuarioEscola(user) {
  if (!user?.escolaId) {
    throw new Error("Usuario sem escola vinculada.");
  }
}

export async function listarProfessoresSupabase(user) {
  validarUsuarioEscola(user);

  let query = supabase
    .from("perfis")
    .select(CAMPOS_PERFIL_PROFESSOR)
    .eq("escola_id", user.escolaId)
    .eq("perfil", "professor")
    .order("nome", { ascending: true });

  if (!perfilGestao(user.role)) {
    query = query.eq("id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Nao foi possivel carregar professores.");
  }

  return (data || []).map(mapearPerfilProfessor);
}

export async function atualizarStatusProfessorSupabase(id, status, user) {
  validarUsuarioEscola(user);

  if (!perfilGestao(user.role)) {
    throw new Error("Usuario sem permissao para atualizar status.");
  }

  const { data, error } = await supabase
    .from("perfis")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .eq("perfil", "professor")
    .select(CAMPOS_PERFIL_PROFESSOR)
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o status do usuario.");
  }

  return mapearPerfilProfessor(data);
}

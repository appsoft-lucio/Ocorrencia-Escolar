import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";

const CAMPOS_TIPO = "id, nome, status, created_at, updated_at";
const CAMPOS_TURMA = "id, codigo, status, created_at, updated_at";

function mapearTipo(row) {
  return {
    id: row.id,
    nome: row.nome,
    status: row.status || "ativo",
    criadoEm: row.created_at || null,
    desativadoEm: row.status === "inativo" ? row.updated_at : null,
  };
}

function mapearTurma(row) {
  return {
    id: row.id,
    nome: row.codigo,
    status: row.status || "ativo",
    criadoEm: row.created_at || null,
    desativadoEm: row.status === "inativo" ? row.updated_at : null,
  };
}

function validarUsuarioEscola(user) {
  if (!user?.escolaId) {
    throw new Error("Usuario sem escola vinculada.");
  }
}

function validarGestao(user) {
  validarUsuarioEscola(user);

  if (!perfilGestao(user.role)) {
    throw new Error("Usuario sem permissao para alterar cadastros escolares.");
  }
}

export async function listarTiposOcorrenciaSupabase(user) {
  validarUsuarioEscola(user);

  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .select(CAMPOS_TIPO)
    .eq("escola_id", user.escolaId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar os tipos de ocorrencia.");
  }

  return (data || []).map(mapearTipo);
}

export async function criarTipoOcorrenciaSupabase(user, nome) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .insert({
      escola_id: user.escolaId,
      nome,
      status: "ativo",
    })
    .select(CAMPOS_TIPO)
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar o tipo de ocorrencia.");
  }

  return mapearTipo(data);
}

export async function atualizarStatusTipoOcorrenciaSupabase(id, status, user) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_TIPO)
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o tipo de ocorrencia.");
  }

  return mapearTipo(data);
}

export async function listarTurmasSupabase(user) {
  validarUsuarioEscola(user);

  const { data, error } = await supabase
    .from("turmas")
    .select(CAMPOS_TURMA)
    .eq("escola_id", user.escolaId)
    .order("codigo", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar as turmas.");
  }

  return (data || []).map(mapearTurma);
}

export async function criarTurmaSupabase(user, codigo) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("turmas")
    .insert({
      escola_id: user.escolaId,
      codigo,
      status: "ativo",
    })
    .select(CAMPOS_TURMA)
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar a turma.");
  }

  return mapearTurma(data);
}

export async function atualizarStatusTurmaSupabase(id, status, user) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("turmas")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_TURMA)
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar a turma.");
  }

  return mapearTurma(data);
}

import { supabase } from "./supabaseClient";

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

export async function listarTiposOcorrenciaSupabase(escolaId) {
  let query = supabase
    .from("tipos_ocorrencia")
    .select("id, nome, status, created_at, updated_at")
    .order("nome", { ascending: true });

  if (escolaId) {
    query = query.eq("escola_id", escolaId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Nao foi possivel carregar os tipos de ocorrencia.");
  }

  return (data || []).map(mapearTipo);
}

export async function criarTipoOcorrenciaSupabase(escolaId, nome) {
  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .insert({
      escola_id: escolaId,
      nome,
      status: "ativo",
    })
    .select("id, nome, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar o tipo de ocorrencia.");
  }

  return mapearTipo(data);
}

export async function atualizarStatusTipoOcorrenciaSupabase(id, status) {
  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .update({ status })
    .eq("id", id)
    .select("id, nome, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o tipo de ocorrencia.");
  }

  return mapearTipo(data);
}

export async function listarTurmasSupabase(escolaId) {
  let query = supabase
    .from("turmas")
    .select("id, codigo, status, created_at, updated_at")
    .order("codigo", { ascending: true });

  if (escolaId) {
    query = query.eq("escola_id", escolaId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Nao foi possivel carregar as turmas.");
  }

  return (data || []).map(mapearTurma);
}

export async function criarTurmaSupabase(escolaId, codigo) {
  const { data, error } = await supabase
    .from("turmas")
    .insert({
      escola_id: escolaId,
      codigo,
      status: "ativo",
    })
    .select("id, codigo, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar a turma.");
  }

  return mapearTurma(data);
}

export async function atualizarStatusTurmaSupabase(id, status) {
  const { data, error } = await supabase
    .from("turmas")
    .update({ status })
    .eq("id", id)
    .select("id, codigo, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar a turma.");
  }

  return mapearTurma(data);
}

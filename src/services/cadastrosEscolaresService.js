import { offlineCollection } from "./offlineStore";
import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";

const tiposOffline = offlineCollection("tipos", listarTiposOcorrenciaSupabaseRemoto, {
  criar: async (user, row) => {
    const existing = (await listarTiposOcorrenciaSupabaseRemoto(user)).find((item) => item.id === row.id);
    return existing || criarTipoOcorrenciaSupabaseRemoto(user, row.nome, row.id);
  },
  status: (user, id, status) => atualizarStatusTipoOcorrenciaSupabaseRemoto(id, status, user),
});
const turmasOffline = offlineCollection("turmas", listarTurmasSupabaseRemoto, {
  criar: async (user, row) => {
    const existing = (await listarTurmasSupabaseRemoto(user)).find((item) => item.id === row.id);
    return existing || criarTurmaSupabaseRemoto(user, row.codigo, row.turno, row.id);
  },
  status: (user, id, status) => atualizarStatusTurmaSupabaseRemoto(id, status, user),
  editar: (user, id, dados) => atualizarTurmaSupabaseRemoto(id, dados, user),
});
export const listarTiposOcorrenciaSupabase = (user) => tiposOffline.list(user);
export const listarTurmasSupabase = (user) => turmasOffline.list(user);

export async function criarTipoOcorrenciaSupabase(user, nome) {
  validarGestao(user);
  const row = { id: crypto.randomUUID(), nome, status: "ativo", criadoEm: new Date().toISOString() };
  return tiposOffline.mutate(user, "criar", [row], [row]);
}
export async function criarTurmaSupabase(user, codigo, turno = "") {
  validarGestao(user);
  const row = { id: crypto.randomUUID(), codigo, nome: codigo, turno, status: "ativo", criadoEm: new Date().toISOString() };
  return turmasOffline.mutate(user, "criar", [row], [row]);
}
async function alterarCadastro(collection, user, id, dados, operation, args) {
  validarGestao(user);
  const row = (await collection.list(user)).find((item) => item.id === id);
  if (!row) throw new Error("Cadastro não disponível neste dispositivo.");
  return collection.mutate(user, operation, args, [{ ...row, ...dados }]);
}
export const atualizarStatusTipoOcorrenciaSupabase = (id, status, user) =>
  alterarCadastro(tiposOffline, user, id, { status }, "status", [id, status]);
export const atualizarStatusTurmaSupabase = (id, status, user) =>
  alterarCadastro(turmasOffline, user, id, { status }, "status", [id, status]);
export const atualizarTurmaSupabase = (id, dados, user) =>
  alterarCadastro(turmasOffline, user, id, { ...dados, nome: dados.codigo }, "editar", [id, dados]);

const CAMPOS_TIPO = "id, nome, status, created_at, updated_at";
const CAMPOS_TURMA = "id, codigo, turno, status, created_at, updated_at";
const CAMPOS_TURMA_BASE = "id, codigo, status, created_at, updated_at";

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
    codigo: row.codigo,
    turno: row.turno || "",
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

async function listarTiposOcorrenciaSupabaseRemoto(user) {
  validarUsuarioEscola(user);

  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .select(CAMPOS_TIPO)
    .eq("escola_id", user.escolaId)
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar os tipos de ocorrencia.", { cause: error });
  }

  return (data || []).map(mapearTipo);
}

async function criarTipoOcorrenciaSupabaseRemoto(user, nome, id) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .insert({
      id,
      escola_id: user.escolaId,
      nome,
      status: "ativo",
    })
    .select(CAMPOS_TIPO)
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar o tipo de ocorrencia.", { cause: error });
  }

  return mapearTipo(data);
}

async function atualizarStatusTipoOcorrenciaSupabaseRemoto(id, status, user) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("tipos_ocorrencia")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_TIPO)
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o tipo de ocorrencia.", { cause: error });
  }

  return mapearTipo(data);
}

async function listarTurmasSupabaseRemoto(user) {
  validarUsuarioEscola(user);

  const { data, error } = await supabase
    .from("turmas")
    .select(CAMPOS_TURMA)
    .eq("escola_id", user.escolaId)
    .order("codigo", { ascending: true });

  if (error?.code === "42703") {
    const { data: dataBase, error: errorBase } = await supabase
      .from("turmas")
      .select(CAMPOS_TURMA_BASE)
      .eq("escola_id", user.escolaId)
      .order("codigo", { ascending: true });

    if (errorBase) {
      throw new Error("Nao foi possivel carregar as turmas.", { cause: errorBase });
    }

    return (dataBase || []).map(mapearTurma);
  }

  if (error) {
    throw new Error("Nao foi possivel carregar as turmas.", { cause: error });
  }

  return (data || []).map(mapearTurma);
}

async function criarTurmaSupabaseRemoto(user, codigo, turno = "", id) {
  validarGestao(user);

  const payload = {
    id,
    escola_id: user.escolaId,
    codigo,
    turno: turno || null,
    status: "ativo",
  };

  const { data, error } = await supabase
    .from("turmas")
    .insert(payload)
    .select(CAMPOS_TURMA)
    .single();

  if (error?.code === "42703") {
    const payloadBase = { id: payload.id, escola_id: payload.escola_id, codigo: payload.codigo, status: payload.status };
    const { data: dataBase, error: errorBase } = await supabase
      .from("turmas")
      .insert(payloadBase)
      .select(CAMPOS_TURMA_BASE)
      .single();

    if (errorBase) {
      throw new Error("Nao foi possivel salvar a turma.", { cause: errorBase });
    }

    return mapearTurma(dataBase);
  }

  if (error) {
    throw new Error("Nao foi possivel salvar a turma.", { cause: error });
  }

  return mapearTurma(data);
}

async function atualizarStatusTurmaSupabaseRemoto(id, status, user) {
  validarGestao(user);

  const { data, error } = await supabase
    .from("turmas")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_TURMA)
    .single();

  if (error?.code === "42703") {
    const { data: dataBase, error: errorBase } = await supabase
      .from("turmas")
      .update({ status })
      .eq("id", id)
      .eq("escola_id", user.escolaId)
      .select(CAMPOS_TURMA_BASE)
      .single();

    if (errorBase) {
      throw new Error("Nao foi possivel atualizar a turma.", { cause: errorBase });
    }

    return mapearTurma(dataBase);
  }

  if (error) {
    throw new Error("Nao foi possivel atualizar a turma.", { cause: error });
  }

  return mapearTurma(data);
}

async function atualizarTurmaSupabaseRemoto(id, dados, user) {
  validarGestao(user);

  const payload = {
    codigo: dados.codigo,
    turno: dados.turno || null,
  };

  const { data, error } = await supabase
    .from("turmas")
    .update(payload)
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_TURMA)
    .single();

  if (error?.code === "42703") {
    const { data: dataBase, error: errorBase } = await supabase
      .from("turmas")
      .update({ codigo: dados.codigo })
      .eq("id", id)
      .eq("escola_id", user.escolaId)
      .select(CAMPOS_TURMA_BASE)
      .single();

    if (errorBase) {
      throw new Error("Nao foi possivel editar a turma.", { cause: errorBase });
    }

    return mapearTurma(dataBase);
  }

  if (error) {
    throw new Error("Nao foi possivel editar a turma.", { cause: error });
  }

  return mapearTurma(data);
}

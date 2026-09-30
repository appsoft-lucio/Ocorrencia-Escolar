import { offlineCollection } from "./offlineStore";
import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";
import { podeAcessarTurma } from "../utils/turnos";

const offline = offlineCollection("ocorrencias", listarOcorrenciasSupabaseRemoto, {
  criar: async (user, row) => {
    const existing = (await listarOcorrenciasSupabaseRemoto(user)).find((item) => item.id === row.id);
    return existing || criarOcorrenciaSupabaseRemoto(row, user);
  },
  atualizar: (user, id, dados) => atualizarStatusOcorrenciaSupabaseRemoto(id, dados, user),
});

export const listarOcorrenciasSupabase = (user) => offline.list(user);

export async function criarOcorrenciaSupabase(dados, user) {
  validarUsuarioEscola(user);
  if (!podeAcessarTurma(user, dados)) throw new Error("Turno não permitido.");
  const createdAt = new Date().toISOString();
  const row = { ...dados, id: crypto.randomUUID(), createdAt, data: formatarData(createdAt),
    escolaId: user.escolaId, professorId: user.id, professorNome: user.nome,
    status: dados.status || "Pendente" };
  return offline.mutate(user, "criar", [row], [row]);
}

export async function atualizarStatusOcorrenciaSupabase(id, dados, user) {
  validarUsuarioEscola(user);
  if (!perfilGestao(user.role)) throw new Error("Usuário sem permissão para atualizar status.");
  const row = (await offline.list(user)).find((item) => item.id === id);
  if (!row || !podeAcessarTurma(user, row)) throw new Error("Ocorrência sem permissão de acesso.");
  return offline.mutate(user, "atualizar", [id, dados], [{ ...row, ...dados }]);
}

const CAMPOS_OCORRENCIA = `
  id,
  escola_id,
  professor_id,
  professor_nome,
  alunos,
  disciplina,
  turno,
  turma,
  horario,
  tipos,
  observacao,
  solicitar_responsavel,
  responsavel_compareceu,
  responsavel_compareceu_por,
  responsavel_compareceu_em,
  status,
  status_atualizado_por,
  status_atualizado_em,
  created_at
`;

function formatarData(data) {
  if (!data) return "";

  return new Date(data).toLocaleString("pt-BR");
}

export function mapearOcorrenciaSupabase(row) {
  return {
    id: row.id,
    professorId: row.professor_id,
    professorNome: row.professor_nome,
    escolaId: row.escola_id,
    turno: row.turno,
    horario: row.horario || "",
    disciplina: row.disciplina,
    turma: row.turma,
    alunos: row.alunos || [],
    tipos: row.tipos || [],
    observacao: row.observacao || "",
    solicitarResponsavel: row.solicitar_responsavel || false,
    responsavelCompareceu: row.responsavel_compareceu || false,
    responsavelCompareceuPor: row.responsavel_compareceu_por || null,
    responsavelCompareceuEm: row.responsavel_compareceu_em
      ? formatarData(row.responsavel_compareceu_em)
      : null,
    data: formatarData(row.created_at),
    status: row.status,
    statusAtualizadoPor: row.status_atualizado_por,
    statusAtualizadoEm: row.status_atualizado_em
      ? formatarData(row.status_atualizado_em)
      : null,
  };
}

function validarUsuarioEscola(user) {
  if (!user?.escolaId) {
    throw new Error("Usuario sem escola vinculada.");
  }
}

async function listarOcorrenciasSupabaseRemoto(user) {
  validarUsuarioEscola(user);

  let query = supabase
    .from("ocorrencias")
    .select(CAMPOS_OCORRENCIA)
    .eq("escola_id", user.escolaId)
    .order("created_at", { ascending: false });

  if (!perfilGestao(user.role)) {
    query = query.eq("professor_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Nao foi possivel carregar as ocorrencias.", { cause: error });
  }

  return (data || []).map(mapearOcorrenciaSupabase);
}

async function criarOcorrenciaSupabaseRemoto(ocorrencia, user) {
  validarUsuarioEscola(user);

  const { data, error } = await supabase
    .from("ocorrencias")
    .insert({
      id: ocorrencia.id,
      created_at: ocorrencia.createdAt,
      escola_id: user.escolaId,
      professor_id: user.id,
      professor_nome: user.nome,
      alunos: ocorrencia.alunos || [],
      disciplina: ocorrencia.disciplina,
      turno: ocorrencia.turno,
      turma: ocorrencia.turma,
      horario: ocorrencia.horario || null,
      tipos: ocorrencia.tipos || [],
      observacao: ocorrencia.observacao || null,
      solicitar_responsavel: ocorrencia.solicitarResponsavel || false,
      responsavel_compareceu: ocorrencia.responsavelCompareceu || false,
      status: ocorrencia.status || "Pendente",
    })
    .select(CAMPOS_OCORRENCIA)
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar a ocorrencia.", { cause: error });
  }

  return mapearOcorrenciaSupabase(data);
}

async function atualizarStatusOcorrenciaSupabaseRemoto(id, statusData, user) {
  validarUsuarioEscola(user);

  if (!perfilGestao(user.role)) {
    throw new Error("Usuario sem permissao para atualizar status.");
  }

  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      ...(statusData.status !== undefined && {
        status: statusData.status,
        status_atualizado_por: statusData.statusAtualizadoPor,
        status_atualizado_em: new Date().toISOString(),
      }),
      ...(statusData.responsavelCompareceu !== undefined && {
        responsavel_compareceu: statusData.responsavelCompareceu,
        responsavel_compareceu_por: statusData.responsavelCompareceuPor,
        responsavel_compareceu_em: new Date().toISOString(),
      }),
    })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_OCORRENCIA)
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o status da ocorrencia.", { cause: error });
  }

  return mapearOcorrenciaSupabase(data);
}

import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";

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

export async function listarOcorrenciasSupabase(user) {
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
    throw new Error("Nao foi possivel carregar as ocorrencias.");
  }

  return (data || []).map(mapearOcorrenciaSupabase);
}

export async function criarOcorrenciaSupabase(ocorrencia, user) {
  validarUsuarioEscola(user);

  const { data, error } = await supabase
    .from("ocorrencias")
    .insert({
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
      status: ocorrencia.status || "Pendente",
    })
    .select(CAMPOS_OCORRENCIA)
    .single();

  if (error) {
    throw new Error("Nao foi possivel salvar a ocorrencia.");
  }

  return mapearOcorrenciaSupabase(data);
}

export async function atualizarStatusOcorrenciaSupabase(id, statusData, user) {
  validarUsuarioEscola(user);

  if (!perfilGestao(user.role)) {
    throw new Error("Usuario sem permissao para atualizar status.");
  }

  const { data, error } = await supabase
    .from("ocorrencias")
    .update({
      status: statusData.status,
      status_atualizado_por: statusData.statusAtualizadoPor,
      status_atualizado_em: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS_OCORRENCIA)
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar o status da ocorrencia.");
  }

  return mapearOcorrenciaSupabase(data);
}

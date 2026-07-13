import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";

const CAMPOS = `
  id, nome, turno, status, turma_id, arquivado_em, created_at, updated_at,
  turmas (id, codigo, turno)
`;

function mapearAluno(row) {
  return {
    id: row.id,
    nome: row.nome,
    turmaId: row.turma_id,
    turma: row.turmas?.codigo || "",
    turno: row.turno || row.turmas?.turno || "",
    status: row.status || "ativo",
    arquivadoEm: row.arquivado_em || null,
    criadoEm: row.created_at || null,
    atualizadoEm: row.updated_at || null,
  };
}

function validarGestao(user) {
  if (!user?.escolaId || !perfilGestao(user.role)) {
    throw new Error("Usuario sem permissao para gerenciar alunos.");
  }
}

export async function listarAlunosSupabase(user) {
  if (!user?.escolaId) return [];

  const { data, error } = await supabase
    .from("alunos")
    .select(CAMPOS)
    .eq("escola_id", user.escolaId)
    .order("nome", { ascending: true });

  if (error) throw new Error("Nao foi possivel carregar os alunos.");
  return (data || []).map(mapearAluno);
}

export async function criarAlunoSupabase(user, dados) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .insert({
      escola_id: user.escolaId,
      nome: dados.nome,
      turma_id: dados.turmaId,
      turno: dados.turno,
      status: "ativo",
    })
    .select(CAMPOS)
    .single();

  if (error) throw new Error("Nao foi possivel cadastrar o aluno.");
  return mapearAluno(data);
}

export async function atualizarAlunoSupabase(user, id, dados) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .update({ nome: dados.nome, turma_id: dados.turmaId, turno: dados.turno })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS)
    .single();

  if (error) throw new Error("Nao foi possivel atualizar ou transferir o aluno.");
  return mapearAluno(data);
}

export async function atualizarStatusAlunoSupabase(user, id, status) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS)
    .single();

  if (error) throw new Error("Nao foi possivel atualizar o aluno.");
  return mapearAluno(data);
}

export async function arquivarAlunoSupabase(user, id) {
  validarGestao(user);
  const { error } = await supabase
    .from("alunos")
    .update({ status: "inativo", arquivado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("escola_id", user.escolaId);

  if (error) throw new Error("Nao foi possivel excluir o aluno da lista.");
  return true;
}

export async function importarAlunosSupabase(user, alunos) {
  validarGestao(user);
  const resultados = [];
  for (const aluno of alunos) {
    resultados.push(await criarAlunoSupabase(user, aluno));
  }
  return resultados;
}

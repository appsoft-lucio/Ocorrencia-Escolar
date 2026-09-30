import { listarTurmasSupabase } from "./cadastrosEscolaresService";
import { offlineCollection } from "./offlineStore";
import { supabase } from "./supabaseClient";
import { perfilGestao } from "../utils/permissoes";

const offline = offlineCollection("alunos", listarAlunosSupabaseRemoto, {
  criar: async (user, dados) => {
    const existing = (await listarAlunosSupabaseRemoto(user)).find((item) => item.id === dados.id);
    return existing || criarAlunoSupabaseRemoto(user, dados);
  },
  editar: atualizarAlunoSupabaseRemoto,
  status: atualizarStatusAlunoSupabaseRemoto,
  arquivar: arquivarAlunoSupabaseRemoto,
  importar: async (user, dados) => {
    const ids = new Set((await listarAlunosSupabaseRemoto(user)).map((item) => item.id));
    const remaining = dados.filter((item) => !ids.has(item.id));
    if (remaining.length) await importarAlunosSupabaseRemoto(user, remaining);
  },
});
export const listarAlunosSupabase = (user) => offline.list(user);

async function alunoLocal(user, dados, turmas) {
  const turma = (turmas || await listarTurmasSupabase(user)).find((item) => item.id === dados.turmaId);
  if (!turma) throw new Error("Turma não disponível neste dispositivo.");
  return { ...dados, id: dados.id || crypto.randomUUID(), turma: turma.codigo,
    turno: dados.turno || turma.turno, status: "ativo", criadoEm: new Date().toISOString() };
}
export async function criarAlunoSupabase(user, dados) {
  validarGestao(user);
  const row = await alunoLocal(user, dados);
  return offline.mutate(user, "criar", [row], [row]);
}
async function alterarAluno(user, id, dados, operation, args) {
  validarGestao(user);
  const row = (await offline.list(user)).find((item) => item.id === id);
  if (!row) throw new Error("Aluno não disponível neste dispositivo.");
  return offline.mutate(user, operation, args, [{ ...row, ...dados }]);
}
export async function atualizarAlunoSupabase(user, id, dados) {
  validarGestao(user);
  const local = await alunoLocal(user, { ...dados, id });
  return alterarAluno(user, id, { nome: local.nome, turmaId: local.turmaId, turma: local.turma, turno: local.turno }, "editar", [id, dados]);
}
export const atualizarStatusAlunoSupabase = (user, id, status) => alterarAluno(user, id, { status }, "status", [id, status]);
export const arquivarAlunoSupabase = (user, id) => alterarAluno(user, id, { status: "inativo", arquivadoEm: new Date().toISOString() }, "arquivar", [id]);
export async function importarAlunosSupabase(user, alunos) {
  validarGestao(user);
  const turmas = await listarTurmasSupabase(user);
  const rows = await Promise.all(alunos.map((item) => alunoLocal(user, item, turmas)));
  await offline.mutate(user, "importar", [rows], rows);
  return rows;
}

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

async function listarAlunosSupabaseRemoto(user) {
  if (!user?.escolaId) return [];

  const { data, error } = await supabase
    .from("alunos")
    .select(CAMPOS)
    .eq("escola_id", user.escolaId)
    .order("nome", { ascending: true });

  if (error) throw new Error("Nao foi possivel carregar os alunos.", { cause: error });
  return (data || []).map(mapearAluno);
}

async function criarAlunoSupabaseRemoto(user, dados) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .insert({
      id: dados.id,
      escola_id: user.escolaId,
      nome: dados.nome,
      turma_id: dados.turmaId,
      turno: dados.turno,
      status: "ativo",
    })
    .select(CAMPOS)
    .single();

  if (error?.code === "23505") {
    throw new Error("Este aluno ja esta cadastrado nesta escola.", { cause: error });
  }
  if (error) throw new Error("Nao foi possivel cadastrar o aluno.", { cause: error });
  return mapearAluno(data);
}

async function atualizarAlunoSupabaseRemoto(user, id, dados) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .update({ nome: dados.nome, turma_id: dados.turmaId, turno: dados.turno })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS)
    .single();

  if (error) throw new Error("Nao foi possivel atualizar ou transferir o aluno.", { cause: error });
  return mapearAluno(data);
}

async function atualizarStatusAlunoSupabaseRemoto(user, id, status) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .update({ status })
    .eq("id", id)
    .eq("escola_id", user.escolaId)
    .select(CAMPOS)
    .single();

  if (error) throw new Error("Nao foi possivel atualizar o aluno.", { cause: error });
  return mapearAluno(data);
}

async function arquivarAlunoSupabaseRemoto(user, id) {
  validarGestao(user);
  const { error } = await supabase
    .from("alunos")
    .update({ status: "inativo", arquivado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("escola_id", user.escolaId);

  if (error) throw new Error("Nao foi possivel excluir o aluno da lista.", { cause: error });
  return true;
}

async function importarAlunosSupabaseRemoto(user, alunos) {
  validarGestao(user);
  const { data, error } = await supabase
    .from("alunos")
    .insert(
      alunos.map((aluno) => ({
        id: aluno.id,
        escola_id: user.escolaId,
        nome: aluno.nome,
        turma_id: aluno.turmaId,
        turno: aluno.turno,
        status: "ativo",
      })),
    )
    .select(CAMPOS);

  if (error?.code === "23505") {
    throw new Error("Um ou mais alunos ja estao cadastrados nesta escola.", { cause: error });
  }
  if (error) throw new Error("Nao foi possivel importar os alunos.", { cause: error });
  return (data || []).map(mapearAluno);
}

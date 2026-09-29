export const TURNOS_GESTAO = ["Manha", "Tarde", "Noite"];

export function normalizarTurno(turno = "") {
  return String(turno || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function perfilRestritoPorTurno(role) {
  return ["vice_diretor", "coordenador", "coordenacao"].includes(role);
}

export function podeAcessarTurno(user, registro) {
  if (!user) return false;
  if (!perfilRestritoPorTurno(user.role)) return true;
  const turno = normalizarTurno(user.turno);
  return ["manha", "tarde", "noite"].includes(turno) && turno === normalizarTurno(registro?.turno);
}

export function codigosTurmasAtivas(turmas = []) {
  return turmas.filter((turma) => typeof turma === "string" || turma.status !== "inativo")
    .map((turma) => typeof turma === "string" ? turma : turma.codigo || turma.nome)
    .filter(Boolean);
}

export function podeAcessarTurma(user, registro) {
  if (!podeAcessarTurno(user, registro)) return false;
  if (user.role !== "professor") return true;
  const codigo = registro?.codigo || registro?.turma;
  return Boolean(codigo) && codigosTurmasAtivas(user.turmas).includes(codigo);
}

export function podeAcessarProfessor(user, professor, turmas = []) {
  if (!user) return false;
  if (user.role === "professor") return String(user.id) === String(professor.id);
  if (!perfilRestritoPorTurno(user.role)) return true;
  const codigos = codigosTurmasAtivas(professor.turmas);
  return turmas.some((turma) => codigos.includes(turma.codigo || turma.nome) && podeAcessarTurno(user, turma));
}

export const PERFIS = {
  DESENVOLVEDOR: "desenvolvedor",
  DIRETOR: "diretor",
  DIRECAO: "direcao",
  VICE_DIRETOR: "vice_diretor",
  COORDENADOR: "coordenador",
  COORDENACAO: "coordenacao",
  PROFESSOR: "professor",
};

export const MODULOS = {
  ESCOLAS: "escolas",
  DASHBOARD: "dashboard",
  OCORRENCIAS: "ocorrencias",
  ALUNOS: "alunos",
  PROFESSORES: "professores",
  RELATORIOS: "relatorios",
  CONFIGURACAO: "configuracao",
  USUARIOS: "usuarios",
  COORDENADOR: "coordenador",
};

const PERFIS_GESTAO = [
  PERFIS.DIRETOR,
  PERFIS.DIRECAO,
  PERFIS.VICE_DIRETOR,
  PERFIS.COORDENADOR,
  PERFIS.COORDENACAO,
];

const PERFIS_ESCOLA = [...PERFIS_GESTAO, PERFIS.PROFESSOR];

const PERMISSOES_POR_MODULO = {
  [MODULOS.ESCOLAS]: [PERFIS.DESENVOLVEDOR],
  [MODULOS.DASHBOARD]: PERFIS_ESCOLA,
  [MODULOS.OCORRENCIAS]: PERFIS_ESCOLA,
  [MODULOS.ALUNOS]: PERFIS_ESCOLA,
  [MODULOS.PROFESSORES]: PERFIS_GESTAO,
  [MODULOS.RELATORIOS]: PERFIS_GESTAO,
  [MODULOS.CONFIGURACAO]: PERFIS_ESCOLA,
  [MODULOS.USUARIOS]: PERFIS_GESTAO,
  [MODULOS.COORDENADOR]: PERFIS_GESTAO,
};

export function normalizarPerfil(role = "") {
  return role.toString().trim().toLowerCase();
}

export function perfilDesenvolvedor(role = "") {
  return normalizarPerfil(role) === PERFIS.DESENVOLVEDOR;
}

export function perfilGestao(role = "") {
  return PERFIS_GESTAO.includes(normalizarPerfil(role));
}

export function podeAcessarModulo(user, modulo) {
  if (!user?.role || !modulo) return false;

  const perfisPermitidos = PERMISSOES_POR_MODULO[modulo] || [];
  return perfisPermitidos.includes(normalizarPerfil(user.role));
}

export function obterRotaInicial(user) {
  if (!user) return "/";
  return perfilDesenvolvedor(user.role) ? "/escolas" : "/dashboard";
}

export function podeGerenciarUsuariosEscola(role = "") {
  return perfilGestao(role);
}

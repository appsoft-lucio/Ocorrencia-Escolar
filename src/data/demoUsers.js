export const ESCOLAS_STORAGE_KEY = "sistemaEscolas";

export const ESCOLAS_INICIAIS = [
  {
    id: "ee-imaculada-conceicao",
    nome: "Escola Estadual Imaculada Conceicao",
    cidade: "",
    status: "ativo",
    diretorNome: "Direcao",
    diretorLogin: "diretor-imaculada",
    diretorSenha: "123",
  },
  {
    id: "em-filinha-gama",
    nome: "Escola Municipal Filinha Gama",
    cidade: "",
    status: "ativo",
    diretorNome: "Direcao",
    diretorLogin: "diretor-filinha",
    diretorSenha: "123",
  },
];

export const DEMO_USERS = [
  {
    id: "desenvolvedor",
    login: "Desenvolvedor",
    senha: "DevEscola362328.",
    nome: "Desenvolvedor",
    role: "desenvolvedor",
  },
];

function normalizarLogin(login = "") {
  return login.trim().toLowerCase();
}

function normalizarEscola(escola) {
  return {
    ...escola,
    id: escola.id || `escola-${Date.now()}`,
    nome: escola.nome || "",
    cidade: escola.cidade || "",
    status: escola.status || "ativo",
    diretorNome: escola.diretorNome || "Direcao",
    diretorLogin: escola.diretorLogin || "",
    diretorSenha: escola.diretorSenha || "",
  };
}

export function carregarEscolasSistema() {
  try {
    const saved = localStorage.getItem(ESCOLAS_STORAGE_KEY);
    if (!saved) return ESCOLAS_INICIAIS.map(normalizarEscola);

    const parsed = JSON.parse(saved);
    return Array.isArray(parsed)
      ? parsed.map(normalizarEscola)
      : ESCOLAS_INICIAIS.map(normalizarEscola);
  } catch (error) {
    console.error("Erro ao carregar escolas:", error);
    return ESCOLAS_INICIAIS.map(normalizarEscola);
  }
}

export function salvarEscolasSistema(escolas) {
  localStorage.setItem(
    ESCOLAS_STORAGE_KEY,
    JSON.stringify(escolas.map(normalizarEscola)),
  );
}

function encontrarDiretorDaEscola(login, senha) {
  const loginNormalizado = normalizarLogin(login);

  const escola = carregarEscolasSistema().find(
    (item) =>
      item.status !== "inativo" &&
      normalizarLogin(item.diretorLogin) === loginNormalizado &&
      item.diretorSenha === senha,
  );

  if (!escola) return null;

  return {
    id: `direcao-${escola.id}`,
    login: escola.diretorLogin,
    nome: escola.diretorNome,
    role: "direcao",
    escolaId: escola.id,
    escolaNome: escola.nome,
    escolaCidade: escola.cidade,
  };
}

function encontrarAcessoCadastrado(login, senha) {
  try {
    const acessos = JSON.parse(localStorage.getItem("acessosUsuarios") || "{}");
    const escolas = carregarEscolasSistema();
    const loginNormalizado = normalizarLogin(login);

    const entrada = Object.entries(acessos).find(([chave, acesso]) => {
      const email = normalizarLogin(acesso?.email || "");
      const chaveNormalizada = normalizarLogin(chave);

      return (
        acesso?.senha === senha &&
        (email === loginNormalizado || chaveNormalizada === loginNormalizado)
      );
    });

    if (!entrada) return null;

    const [chave, acesso] = entrada;
    const escola = escolas.find((item) => item.id === acesso.escolaId);

    if (!escola || escola.status === "inativo") return null;

    return {
      id: acesso.id || chave,
      login: acesso.email || chave,
      nome: acesso.nome,
      role: acesso.role,
      escolaId: escola.id,
      escolaNome: escola.nome,
      escolaCidade: escola.cidade,
    };
  } catch (error) {
    console.error("Erro ao carregar acessos cadastrados:", error);
    return null;
  }
}

export function encontrarUsuarioDemo(login, senha) {
  const loginNormalizado = normalizarLogin(login);

  const usuarioInicial = DEMO_USERS.find(
    (usuario) =>
      normalizarLogin(usuario.login) === loginNormalizado && usuario.senha === senha,
  );

  return (
    usuarioInicial ||
    encontrarDiretorDaEscola(login, senha) ||
    encontrarAcessoCadastrado(login, senha)
  );
}

export function usuarioDemoValido(user) {
  if (user?.role === "desenvolvedor") return user.id === "desenvolvedor";

  if (!user?.id || !user?.nome || !user?.role || !user?.escolaId) return false;

  return carregarEscolasSistema().some(
    (escola) => escola.id === user.escolaId && escola.status !== "inativo",
  );
}

export const DEMO_USERS = [
  {
    id: "demo-professor",
    login: "professor",
    senha: "123",
    nome: "Professor Demo",
    role: "professor",
  },
  {
    id: "demo-direcao",
    login: "direcao",
    senha: "123",
    nome: "Direção Demo",
    role: "direcao",
  },
];

export function encontrarUsuarioDemo(login, senha) {
  const loginNormalizado = login.trim().toLowerCase();

  return DEMO_USERS.find(
    (usuario) => usuario.login === loginNormalizado && usuario.senha === senha,
  );
}

export function usuarioDemoValido(user) {
  return DEMO_USERS.some((usuario) => usuario.id === user?.id);
}

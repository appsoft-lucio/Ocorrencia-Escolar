import "./Usuarios.css";

import { useContext, useEffect, useMemo, useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import {
  carregarEscolasSistema,
  obterNomePerfil,
  obterPerfisGerenciaveis,
  normalizarPerfil,
} from "../../data/demoUsers";
import {
  criarUsuarioEscolaSupabase,
  listarUsuariosEscolaSupabase,
} from "../../services/usuariosService";

const ACESSOS_STORAGE_KEY = "acessosUsuarios";

const FORM_INICIAL = {
  chave: null,
  id: null,
  nome: "",
  role: "",
  login: "",
  email: "",
  whatsapp: "",
  senha: "",
  status: "ativo",
};

function lerAcessos() {
  try {
    const saved = localStorage.getItem(ACESSOS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    console.error("Erro ao carregar usuarios:", error);
    return {};
  }
}

function salvarAcessos(acessos) {
  localStorage.setItem(ACESSOS_STORAGE_KEY, JSON.stringify(acessos));
}

function normalizarLogin(valor = "") {
  return valor.trim().toLowerCase();
}

function criarChaveUsuario(role, id) {
  return `${normalizarPerfil(role)}-${id}`;
}

function criarIdUsuario() {
  return `usuario-${Date.now()}`;
}

function loginJaExiste(acessos, escolas, login, chaveAtual) {
  const loginNormalizado = normalizarLogin(login);

  const loginDeUsuario = Object.entries(acessos).some(([chave, acesso]) => {
    if (chave === chaveAtual) return false;

    return normalizarLogin(acesso.login || chave) === loginNormalizado;
  });

  const loginDeDiretor = escolas.some(
    (escola) => normalizarLogin(escola.diretorLogin) === loginNormalizado,
  );

  return loginDeUsuario || loginDeDiretor;
}

function Usuarios({
  titulo = "Usuarios",
  descricao = "Cadastre acessos e redefina senhas provisórias dos cargos abaixo.",
  perfilFixo = "",
  nomeSingular = "usuario",
  nomePlural = "usuarios",
}) {
  const { user } = useContext(AuthContext);
  const [acessos, setAcessos] = useState(lerAcessos);
  const [usuariosSupabase, setUsuariosSupabase] = useState([]);
  const [form, setForm] = useState(FORM_INICIAL);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const usarSupabase = user?.origem === "supabase";

  const perfisPermitidos = useMemo(() => {
    const gerenciaveis = obterPerfisGerenciaveis(user?.role || "");

    if (!perfilFixo) return gerenciaveis;

    return gerenciaveis.includes(perfilFixo) ? [perfilFixo] : [];
  }, [perfilFixo, user?.role]);

  const usuarios = useMemo(() => {
    if (usarSupabase) {
      return usuariosSupabase
        .filter((usuario) =>
          perfisPermitidos.includes(normalizarPerfil(usuario.role)),
        )
        .sort((a, b) => {
          const perfilA = perfisPermitidos.indexOf(normalizarPerfil(a.role));
          const perfilB = perfisPermitidos.indexOf(normalizarPerfil(b.role));

          if (perfilA !== perfilB) return perfilA - perfilB;
          return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
        });
    }

    return Object.entries(acessos)
      .map(([chave, acesso]) => ({
        chave,
        ...acesso,
        role: normalizarPerfil(acesso.role || ""),
      }))
      .filter(
        (acesso) =>
          acesso.escolaId === user?.escolaId &&
          perfisPermitidos.includes(normalizarPerfil(acesso.role)),
      )
      .sort((a, b) => {
        const perfilA = perfisPermitidos.indexOf(normalizarPerfil(a.role));
        const perfilB = perfisPermitidos.indexOf(normalizarPerfil(b.role));

        if (perfilA !== perfilB) return perfilA - perfilB;
        return (a.nome || "").localeCompare(b.nome || "", "pt-BR");
      });
  }, [acessos, perfisPermitidos, usarSupabase, user?.escolaId, usuariosSupabase]);

  const resumo = useMemo(() => {
    const ativos = usuarios.filter((usuario) => usuario.status !== "inativo").length;

    return {
      total: usuarios.length,
      ativos,
      inativos: usuarios.length - ativos,
    };
  }, [usuarios]);

  useEffect(() => {
    if (usarSupabase) return;
    salvarAcessos(acessos);
  }, [acessos, usarSupabase]);

  useEffect(() => {
    if (!perfilFixo) return;

    setForm((atual) =>
      atual.role === perfilFixo ? atual : { ...atual, role: perfilFixo },
    );
  }, [perfilFixo]);

  useEffect(() => {
    let ativo = true;

    if (!usarSupabase || !user?.escolaId || perfisPermitidos.length === 0) {
      setUsuariosSupabase([]);
      return undefined;
    }

    listarUsuariosEscolaSupabase(user, perfisPermitidos)
      .then((usuariosCarregados) => {
        if (ativo) {
          setUsuariosSupabase(usuariosCarregados);
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar usuarios no Supabase:", error);
        if (ativo) {
          setMensagem("Nao foi possivel carregar usuarios da rede.");
          setUsuariosSupabase([]);
        }
      });

    return () => {
      ativo = false;
    };
  }, [perfisPermitidos, usarSupabase, user]);

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(FORM_INICIAL);
    setMensagem("");
  }

  function editarUsuario(usuario) {
    setForm({
      chave: usuario.chave,
      id: usuario.id,
      nome: usuario.nome || "",
      role: normalizarPerfil(usuario.role || ""),
      login: usuario.login || usuario.email || "",
      email: usuario.email || "",
      whatsapp: usuario.whatsapp || "",
      senha: usuario.senha || "",
      status: usuario.status || "ativo",
    });
    setMensagem(`Editando ${usuario.nome}.`);
  }

  async function salvarUsuario(event) {
    event.preventDefault();

    if (!user) return;
    if (salvando) return;

    if (!form.nome.trim()) {
      setMensagem("Informe o nome completo.");
      return;
    }

    if (!perfisPermitidos.includes(form.role)) {
      setMensagem("Selecione um perfil permitido para seu cargo.");
      return;
    }

    if (!form.login.trim()) {
      setMensagem("Informe o login do usuario.");
      return;
    }

    if (!form.email.trim()) {
      setMensagem("Informe o email do usuario.");
      return;
    }

    if (!form.whatsapp.trim()) {
      setMensagem("Informe o WhatsApp do usuario.");
      return;
    }

    if (!form.senha.trim()) {
      setMensagem("Informe a senha provisoria.");
      return;
    }

    if (form.senha.length < 6) {
      setMensagem("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setSalvando(true);

    try {
      if (usarSupabase) {
        if (form.chave) {
          setMensagem("Edicao de usuario da rede ainda nao esta disponivel.");
          return;
        }

        const usuarioCriado = await criarUsuarioEscolaSupabase({
          nome: form.nome.trim(),
          login: form.login.trim(),
          email: form.email.trim(),
          senha: form.senha,
          perfil: form.role,
          whatsapp: form.whatsapp.trim(),
          status: form.status,
        });

        setUsuariosSupabase((atuais) => atuais.concat(usuarioCriado));
        setMensagem("Usuario da rede cadastrado.");
        setForm(FORM_INICIAL);
        return;
      }

      const escolas = carregarEscolasSistema();

      if (loginJaExiste(acessos, escolas, form.login, form.chave)) {
        setMensagem("Este login ja esta em uso.");
        return;
      }

      const id = form.id || criarIdUsuario();
      const chave = form.chave || criarChaveUsuario(form.role, id);
      const usuarioAtualizado = {
        id,
        nome: form.nome.trim(),
        role: form.role,
        login: form.login.trim(),
        email: form.email.trim(),
        emailContato: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
        senha: form.senha,
        status: form.status,
        escolaId: user.escolaId,
        escolaNome: user.escolaNome,
        escolaCidade: user.escolaCidade,
      };

      setAcessos((atuais) => ({
        ...atuais,
        [chave]: usuarioAtualizado,
      }));
      setMensagem(form.chave ? "Usuario atualizado." : "Usuario cadastrado.");
      setForm(FORM_INICIAL);
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel salvar o usuario.");
    } finally {
      setSalvando(false);
    }
  }

  function alternarStatus(usuario) {
    if (usarSupabase) {
      setMensagem("Alterar status de usuario da rede sera feito no proximo passo.");
      return;
    }

    setAcessos((atuais) => ({
      ...atuais,
      [usuario.chave]: {
        ...atuais[usuario.chave],
        status: usuario.status === "inativo" ? "ativo" : "inativo",
      },
    }));
  }

  if (!user) {
    return <div className="usuarios-feedback">Carregando usuario...</div>;
  }

  return (
    <div className="usuarios-layout">
      <Sidebar />

      <div className="usuarios-main">
        <Header />

        <main className="usuarios-container">
          <section className="usuarios-topo">
            <div>
              <h1>{titulo}</h1>
              <p>{descricao}</p>
            </div>
          </section>

          <section className="usuarios-resumo" aria-label={`Resumo de ${nomePlural}`}>
            <div>
              <strong>{resumo.total}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{resumo.ativos}</strong>
              <span>Ativos</span>
            </div>
            <div>
              <strong>{resumo.inativos}</strong>
              <span>Inativos</span>
            </div>
          </section>

          <section className="usuarios-grid">
            <form className="usuario-form" onSubmit={salvarUsuario}>
              <h2>{form.chave ? `Editar ${nomeSingular}` : `Novo ${nomeSingular}`}</h2>

              {mensagem && <div className="usuario-mensagem">{mensagem}</div>}

              <label>
                Nome completo
                <input
                  value={form.nome}
                  onChange={(event) => atualizarCampo("nome", event.target.value)}
                  placeholder="Nome do usuario"
                />
              </label>

              {!perfilFixo && (
                <label>
                  Perfil
                  <select
                    value={form.role}
                    onChange={(event) => atualizarCampo("role", event.target.value)}
                  >
                    <option value="">Selecione</option>
                    {perfisPermitidos.map((perfil) => (
                      <option key={perfil} value={perfil}>
                        {obterNomePerfil(perfil)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="usuario-form-duplo">
                <label>
                  Login
                  <input
                    value={form.login}
                    onChange={(event) => atualizarCampo("login", event.target.value)}
                    placeholder="usuario.login"
                  />
                </label>

                <label>
                  Senha provisoria
                  <input
                    type="password"
                    minLength={6}
                    aria-describedby="regra-senha-usuario"
                    value={form.senha}
                    onChange={(event) => atualizarCampo("senha", event.target.value)}
                    placeholder="Senha provisoria"
                  />
                  <small id="regra-senha-usuario">
                    Use pelo menos 6 caracteres.
                  </small>
                </label>
              </div>

              <div className="usuario-form-duplo">
                <label>
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => atualizarCampo("email", event.target.value)}
                    placeholder="email@escola.com"
                  />
                </label>

                <label>
                  WhatsApp
                  <input
                    value={form.whatsapp}
                    onChange={(event) =>
                      atualizarCampo("whatsapp", event.target.value)
                    }
                    placeholder="(31) 99999-9999"
                  />
                </label>
              </div>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => atualizarCampo("status", event.target.value)}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </label>

              <div className="usuario-form-acoes">
                <button type="button" onClick={limparFormulario}>
                  {form.chave ? "Cancelar edicao" : "Limpar"}
                </button>
                <button type="submit" disabled={salvando}>
                  {salvando
                    ? "Salvando..."
                    : form.chave
                      ? "Atualizar usuario"
                      : `Cadastrar ${nomeSingular}`}
                </button>
              </div>
            </form>

            <section className="usuarios-lista" aria-label={`${titulo} cadastrados`}>
              {usuarios.length === 0 ? (
                <div className="usuarios-vazio">Nenhum {nomeSingular} cadastrado.</div>
              ) : (
                usuarios.map((usuario) => (
                  <article
                    className={`usuario-item ${
                      usuario.status === "inativo" ? "usuario-inativo" : ""
                    } ${form.chave === usuario.chave ? "usuario-em-edicao" : ""}`}
                    key={usuario.chave}
                  >
                    <div className="usuario-item-topo">
                      <div>
                        <h2>{usuario.nome}</h2>
                        <p>{obterNomePerfil(usuario.role)}</p>
                      </div>

                      <span>
                        {usuario.status === "inativo" ? "Inativo" : "Ativo"}
                      </span>
                    </div>

                    <dl>
                      <div>
                        <dt>Login</dt>
                        <dd>{usuario.login || usuario.email || "-"}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{usuario.emailContato || usuario.email || "-"}</dd>
                      </div>
                      <div>
                        <dt>WhatsApp</dt>
                        <dd>{usuario.whatsapp || "-"}</dd>
                      </div>
                      <div>
                        <dt>Senha provisoria</dt>
                        <dd>{usuario.senha || "-"}</dd>
                      </div>
                    </dl>

                    <div className="usuario-item-acoes">
                      <button type="button" onClick={() => editarUsuario(usuario)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => alternarStatus(usuario)}>
                        {usuario.status === "inativo" ? "Ativar" : "Inativar"}
                      </button>
                    </div>
                  </article>
                ))
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Usuarios;

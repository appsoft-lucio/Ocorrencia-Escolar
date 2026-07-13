import "./configuracao.css";

import { useContext, useEffect, useMemo, useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useMensagemComAlerta } from "../../hooks/useMensagemComAlerta";
import { normalizarPerfil, perfilGestao } from "../../utils/permissoes";

function lerStorage(chave, fallback = []) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : fallback;
  } catch (error) {
    console.error(`Erro ao carregar ${chave}:`, error);
    return fallback;
  }
}

function salvarStorage(chave, valor) {
  localStorage.setItem(chave, JSON.stringify(valor));
}

function normalizarTexto(valor = "") {
  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function criarChaveAcesso(tipo, id, nome) {
  return `${tipo}-${id || normalizarTexto(nome)}`;
}

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function Configuracao() {
  const { user } = useContext(AuthContext);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagemSenha, setMensagemSenha] = useMensagemComAlerta();
  const [mensagemAcesso, setMensagemAcesso] = useMensagemComAlerta();
  const [acessos, setAcessos] = useState(() => lerStorage("acessosUsuarios", {}));

  const perfilAtual = normalizarPerfil(user?.role);
  const isDirecao = ["diretor", "direcao"].includes(perfilAtual);
  const isCoordenacao =
    ["coordenador", "coordenacao", "vice_diretor"].includes(perfilAtual) &&
    !isDirecao;
  const isGestao = perfilGestao(perfilAtual);

  const professores = useMemo(
    () => lerStorage(criarChaveEscola("professores", user?.escolaId)),
    [user?.escolaId],
  );
  const coordenadores = useMemo(
    () => lerStorage(criarChaveEscola("coordenadores", user?.escolaId)),
    [user?.escolaId],
  );

  const acessosGerenciaveis = useMemo(() => {
    if (!user) return [];

    const professoresMapeados = professores.map((professor) => {
      const chave = criarChaveAcesso("professor", professor.id, professor.nome);
      const acessoSalvo = acessos[chave] || {};

      return {
        chave,
        email: acessoSalvo.email || professor.email || "",
        id: professor.id,
        nome: professor.nome,
        role: "professor",
        senha: acessoSalvo.senha || "",
        escolaId: user.escolaId,
        escolaNome: user.escolaNome,
        escolaCidade: user.escolaCidade,
        tipo: "Professor",
      };
    });

    if (!isDirecao) return professoresMapeados;

    const coordenadoresMapeados = coordenadores.map((coordenador) => {
      const chave = criarChaveAcesso("coordenacao", coordenador.id, coordenador.nome);
      const acessoSalvo = acessos[chave] || {};

      return {
        chave,
        email: acessoSalvo.email || coordenador.email || "",
        id: coordenador.id,
        nome: coordenador.nome,
        role: "coordenacao",
        senha: acessoSalvo.senha || "",
        escolaId: user.escolaId,
        escolaNome: user.escolaNome,
        escolaCidade: user.escolaCidade,
        tipo: "Supervisao",
      };
    });

    return [...coordenadoresMapeados, ...professoresMapeados];
  }, [acessos, coordenadores, professores, isDirecao, user]);

  const acessoAtual = useMemo(() => {
    if (!user) return null;

    const chave = criarChaveAcesso(user.role, user.id, user.nome);
    return {
      chave,
      email: acessos[chave]?.email || user.email || "",
      senha: acessos[chave]?.senha || "",
    };
  }, [acessos, user]);

  useEffect(() => {
    salvarStorage("acessosUsuarios", acessos);
  }, [acessos]);

  const alterarMinhaSenha = () => {
    if (!novaSenha || !confirmarSenha) {
      setMensagemSenha("Informe e confirme a nova senha.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setMensagemSenha("As senhas não conferem.");
      return;
    }

    if (novaSenha.length < 6) {
      setMensagemSenha("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (acessoAtual?.senha && senhaAtual !== acessoAtual.senha) {
      setMensagemSenha("Senha atual incorreta.");
      return;
    }

    setAcessos((atuais) => ({
      ...atuais,
      [acessoAtual.chave]: {
        ...atuais[acessoAtual.chave],
        email: acessoAtual.email,
        nome: user.nome,
        role: user.role,
        senha: novaSenha,
        escolaId: user.escolaId,
        escolaNome: user.escolaNome,
        escolaCidade: user.escolaCidade,
      },
    }));
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setMensagemSenha("Senha alterada com sucesso.");
  };

  const atualizarAcesso = (chave, campo, valor) => {
    setAcessos((atuais) => ({
      ...atuais,
      [chave]: {
        ...atuais[chave],
        [campo]: valor,
      },
    }));
  };

  const salvarAcesso = (acesso) => {
    if (acesso.senha.length > 0 && acesso.senha.length < 6) {
      setMensagemAcesso("Use uma senha com pelo menos 6 caracteres.");
      return;
    }

    if (!acesso.email.trim()) {
      setMensagemAcesso("Informe o email de acesso.");
      return;
    }

    if (!acesso.senha.trim()) {
      setMensagemAcesso("Informe uma senha provisória ou definitiva.");
      return;
    }

    setAcessos((atuais) => ({
      ...atuais,
      [acesso.chave]: {
        ...atuais[acesso.chave],
        email: acesso.email.trim(),
        id: acesso.id,
        nome: acesso.nome,
        role: acesso.role,
        senha: acesso.senha,
        escolaId: acesso.escolaId || user.escolaId,
        escolaNome: acesso.escolaNome || user.escolaNome,
        escolaCidade: acesso.escolaCidade || user.escolaCidade,
      },
    }));
    setMensagemAcesso(`Acesso de ${acesso.nome} atualizado.`);
  };

  if (!user) {
    return <div className="configuracao-feedback">Carregando usuário...</div>;
  }

  return (
    <div className="configuracao-layout">
      <Sidebar />

      <div className="configuracao-main">
        <Header />

        <main className="configuracao-container">
          <section className="configuracao-topo">
            <div>
              <h1>Configurações</h1>
              <p>Gerencie segurança, emails de acesso e recuperação de conta.</p>
            </div>
          </section>

          <section className="configuracao-grid">
            <article className="config-card perfil-card">
              <h2>Meu perfil</h2>
              <dl>
                <div>
                  <dt>Nome</dt>
                  <dd>{user.nome}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{acessoAtual?.email || user.email || "Não informado"}</dd>
                </div>
                <div>
                  <dt>Função</dt>
                  <dd>{user.role}</dd>
                </div>
              </dl>
            </article>

            <article className="config-card">
              <h2>Minha senha</h2>
              <p>
                {acessoAtual?.senha
                  ? "Informe a senha atual para alterar."
                  : "Cadastre uma senha inicial para sua conta."}
              </p>

              {mensagemSenha && <div className="mensagem-config">{mensagemSenha}</div>}

              {acessoAtual?.senha && (
                <label>
                  Senha atual
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(event) => setSenhaAtual(event.target.value)}
                  />
                </label>
              )}

              <label>
                Nova senha
                <input
                  type="password"
                  minLength={6}
                  aria-describedby="regra-minha-senha"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                />
                <small id="regra-minha-senha">Use pelo menos 6 caracteres.</small>
              </label>

              <label>
                Confirmar senha
                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                />
              </label>

              <button type="button" onClick={alterarMinhaSenha}>
                Alterar minha senha
              </button>
            </article>
          </section>

          {isGestao && (
            <section className="config-card acessos-card">
              <div className="card-titulo-linha">
                <div>
                  <h2>Gerenciar acessos</h2>
                  <p>
                    {isDirecao
                      ? "Direção pode alterar email e senha da coordenação e dos professores."
                      : "Supervisao pode alterar email e senha dos professores."}
                  </p>
                </div>
              </div>

              {mensagemAcesso && (
                <div className="mensagem-config">{mensagemAcesso}</div>
              )}

              {acessosGerenciaveis.length === 0 ? (
                <p className="estado-vazio">Nenhum usuário disponível para gerenciar.</p>
              ) : (
                <div className="acessos-lista">
                  {acessosGerenciaveis.map((acesso) => (
                    <article className="acesso-item" key={acesso.chave}>
                      <div className="acesso-identidade">
                        <strong>{acesso.nome}</strong>
                        <span>{acesso.tipo}</span>
                      </div>

                      <label>
                        Email
                        <input
                          type="email"
                          value={acesso.email}
                          onChange={(event) =>
                            atualizarAcesso(acesso.chave, "email", event.target.value)
                          }
                          placeholder="email@escola.com"
                        />
                      </label>

                      <label>
                        Senha
                        <input
                          type="password"
                          minLength={6}
                          aria-describedby={`regra-senha-${acesso.chave}`}
                          value={acesso.senha}
                          onChange={(event) =>
                            atualizarAcesso(acesso.chave, "senha", event.target.value)
                          }
                          placeholder="Senha de acesso"
                        />
                        <small id={`regra-senha-${acesso.chave}`}>
                          Use pelo menos 6 caracteres.
                        </small>
                      </label>

                      <button type="button" onClick={() => salvarAcesso(acesso)}>
                        Salvar
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          <section className="config-card recuperacao-card">
            <h2>Recuperação de acesso</h2>
            <p>
              Se o usuário não conseguir redefinir a senha porque perdeu acesso ao
              email cadastrado, deve pedir ao superior para atualizar o email nesta
              tela. Depois disso, ele poderá solicitar a redefinição de senha.
            </p>

            <div className="recuperacao-regras">
              <span>Professor procura a coordenação ou direção.</span>
              <span>Supervisao procura a direção.</span>
              <span>Direção solicita suporte do sistema.</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Configuracao;

import "./Escolas.css";

import { useContext, useEffect, useMemo, useRef, useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import {
  carregarEscolasSistema,
  salvarEscolasSistema,
} from "../../data/demoUsers";
import {
  atualizarEscolaDirecaoSupabase,
  atualizarStatusEscolaSupabase,
  criarEscolaDirecaoSupabase,
  excluirEscolaSupabase,
  listarEscolasSupabase,
} from "../../services/escolasService";

const FORM_INICIAL = {
  id: null,
  nome: "",
  cidade: "",
  diretorNome: "",
  diretorLogin: "",
  diretorEmail: "",
  diretorTelefone: "",
  diretorSenha: "",
  status: "ativo",
};

function criarIdEscola(nome) {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return base || `escola-${Date.now()}`;
}

function Escolas() {
  const { user } = useContext(AuthContext);
  const [escolas, setEscolas] = useState(carregarEscolasSistema);
  const [form, setForm] = useState(FORM_INICIAL);
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);
  const nomeInputRef = useRef(null);
  const formRef = useRef(null);
  const usarSupabase = user?.origem === "supabase";

  useEffect(() => {
    if (usarSupabase) return;
    salvarEscolasSistema(escolas);
  }, [escolas, usarSupabase]);

  useEffect(() => {
    let ativo = true;

    if (!usarSupabase) return undefined;

    listarEscolasSupabase()
      .then((escolasCarregadas) => {
        if (ativo) {
          setEscolas(escolasCarregadas);
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar escolas no Supabase:", error);
        if (ativo) {
          setMensagem("Nao foi possivel carregar escolas da rede.");
          setEscolas([]);
        }
      });

    return () => {
      ativo = false;
    };
  }, [usarSupabase]);

  const resumo = useMemo(() => {
    const ativas = escolas.filter((escola) => escola.status !== "inativo").length;

    return {
      total: escolas.length,
      ativas,
      inativas: escolas.length - ativas,
    };
  }, [escolas]);

  function atualizarCampo(campo, valor) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function limparFormulario() {
    setForm(FORM_INICIAL);
    setMensagem("");
    nomeInputRef.current?.focus();
  }

  function editarEscola(escola) {
    setForm({
      id: escola.id,
      nome: escola.nome,
      cidade: escola.cidade || "",
      diretorNome: escola.diretorNome || "",
      diretorLogin: escola.diretorLogin || "",
      diretorEmail: escola.diretorEmail || escola.diretorLogin || "",
      diretorTelefone: escola.diretorTelefone || "",
      diretorSenha: escola.diretorSenha || "",
      status: escola.status || "ativo",
    });
    setMensagem(`Editando ${escola.nome}.`);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => nomeInputRef.current?.focus(), 100);
  }

  async function salvarEscola(event) {
    event.preventDefault();
    if (salvando) return;

    if (!form.nome.trim()) {
      setMensagem("Informe o nome da escola.");
      return;
    }

    if (!form.diretorNome.trim()) {
      setMensagem("Informe o nome do diretor.");
      return;
    }

    if (!form.diretorLogin.trim()) {
      setMensagem("Informe o usuario do diretor.");
      return;
    }

    if (!form.diretorEmail.trim()) {
      setMensagem(
        usarSupabase
          ? "Informe o email da direcao."
          : "Informe o email do diretor.",
      );
      return;
    }

    if (!form.diretorTelefone.trim()) {
      setMensagem("Informe o WhatsApp do diretor.");
      return;
    }

    if (!form.id && !form.diretorSenha.trim()) {
      setMensagem("Informe a senha do diretor.");
      return;
    }

    setSalvando(true);

    try {
      if (usarSupabase) {
        if (form.id) {
          const escolaAtualizada = await atualizarEscolaDirecaoSupabase(form.id, {
            nome: form.nome.trim(),
            cidade: form.cidade.trim(),
            diretorNome: form.diretorNome.trim(),
            diretorLogin: form.diretorLogin.trim(),
            diretorEmail: form.diretorEmail.trim(),
            diretorTelefone: form.diretorTelefone.trim(),
            status: form.status,
          });

          setEscolas((atuais) =>
            atuais.map((escola) =>
              escola.id === form.id ? escolaAtualizada : escola,
            ),
          );
          setMensagem("Escola atualizada com sucesso.");
          setForm(FORM_INICIAL);
          return;
        }

        const escolaCriada = await criarEscolaDirecaoSupabase({
          nome: form.nome.trim(),
          cidade: form.cidade.trim(),
          diretorNome: form.diretorNome.trim(),
          diretorLogin: form.diretorLogin.trim(),
          diretorEmail: form.diretorEmail.trim(),
          diretorTelefone: form.diretorTelefone.trim(),
          diretorSenha: form.diretorSenha,
          status: form.status,
        });

        setEscolas((atuais) => atuais.concat(escolaCriada));
        setMensagem("Escola e direcao da rede cadastradas.");
        setForm(FORM_INICIAL);
        return;
      }

      const id = form.id || criarIdEscola(form.nome);
      const loginEmUso = escolas.some(
        (escola) =>
          escola.id !== id &&
          (escola.diretorLogin || "").trim().toLowerCase() ===
            form.diretorLogin.trim().toLowerCase(),
      );

      if (loginEmUso) {
        setMensagem("Este usuario de diretor ja esta em uso.");
        return;
      }

      const escolaAtualizada = {
        id,
        nome: form.nome.trim(),
        cidade: form.cidade.trim(),
        diretorNome: form.diretorNome.trim(),
        diretorLogin: form.diretorLogin.trim(),
        diretorEmail: form.diretorEmail.trim(),
        diretorTelefone: form.diretorTelefone.trim(),
        diretorSenha: form.diretorSenha,
        status: form.status,
      };

      setEscolas((atuais) => {
        const existe = atuais.some((escola) => escola.id === id);

        if (existe) {
          return atuais.map((escola) =>
            escola.id === id ? escolaAtualizada : escola,
          );
        }

        return [...atuais, escolaAtualizada];
      });

      setMensagem(form.id ? "Escola atualizada com sucesso." : "Escola salva com sucesso.");
      setForm(FORM_INICIAL);
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel salvar a escola.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(escolaId) {
    if (usarSupabase) {
      const escolaAtual = escolas.find((escola) => escola.id === escolaId);
      if (!escolaAtual) return;

      try {
        const escolaAtualizada = await atualizarStatusEscolaSupabase(
          escolaId,
          escolaAtual.status === "inativo" ? "ativo" : "inativo",
        );
        setEscolas((atuais) =>
          atuais.map((escola) =>
            escola.id === escolaId
              ? { ...escola, status: escolaAtualizada.status }
              : escola,
          ),
        );
      } catch (error) {
        setMensagem(error.message || "Nao foi possivel atualizar a escola.");
      }
      return;
    }

    setEscolas((atuais) =>
      atuais.map((escola) =>
        escola.id === escolaId
          ? {
              ...escola,
              status: escola.status === "inativo" ? "ativo" : "inativo",
            }
          : escola,
      ),
    );
  }

  async function excluirEscola(escolaId) {
    const escola = escolas.find((item) => item.id === escolaId);
    if (!escola) return;

    const confirmar = window.confirm(
      `Excluir a escola "${escola.nome}"? Esta acao nao pode ser desfeita.`,
    );

    if (!confirmar) return;

    try {
      if (usarSupabase) {
        await excluirEscolaSupabase(escolaId);
      }

      setEscolas((atuais) => atuais.filter((item) => item.id !== escolaId));
      if (form.id === escolaId) {
        setForm(FORM_INICIAL);
      }
      setMensagem("Escola excluida com sucesso.");
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel excluir a escola.");
    }
  }

  return (
    <div className="escolas-layout">
      <Sidebar />

      <div className="escolas-main">
        <Header />

        <main className="escolas-container">
          <section className="escolas-topo">
            <div>
              <h1>Escolas</h1>
              <p>Cadastre escolas, defina o diretor e controle o acesso.</p>
            </div>
          </section>

          <section className="escolas-resumo" aria-label="Resumo de escolas">
            <div>
              <strong>{resumo.total}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{resumo.ativas}</strong>
              <span>Ativas</span>
            </div>
            <div>
              <strong>{resumo.inativas}</strong>
              <span>Inativas</span>
            </div>
          </section>

          <section className="escolas-grid">
            <form className="escola-form" onSubmit={salvarEscola} ref={formRef}>
              <h2>{form.id ? "Editar escola" : "Nova escola"}</h2>

              {mensagem && <div className="escola-mensagem">{mensagem}</div>}

              <label>
                Nome da escola
                <input
                  ref={nomeInputRef}
                  value={form.nome}
                  onChange={(event) => atualizarCampo("nome", event.target.value)}
                  placeholder="Ex: Escola Municipal Filinha Gama"
                />
              </label>

              <label>
                Cidade ou observacao
                <input
                  value={form.cidade}
                  onChange={(event) => atualizarCampo("cidade", event.target.value)}
                  placeholder="Opcional"
                />
              </label>

              <label>
                Nome do diretor
                <input
                  value={form.diretorNome}
                  onChange={(event) =>
                    atualizarCampo("diretorNome", event.target.value)
                  }
                  placeholder="Nome do diretor"
                />
              </label>

              <label>
                Usuario do diretor
                <input
                  value={form.diretorLogin}
                  onChange={(event) =>
                    atualizarCampo("diretorLogin", event.target.value)
                  }
                  placeholder="direcao.imaculada"
                />
              </label>

              <div className="escola-form-duplo">
                <label>
                  Email do diretor
                  <input
                    type="email"
                    value={form.diretorEmail}
                    onChange={(event) =>
                      atualizarCampo("diretorEmail", event.target.value)
                    }
                    placeholder="direcao@escola.com"
                  />
                </label>

                <label>
                  WhatsApp do diretor
                  <input
                    value={form.diretorTelefone}
                    onChange={(event) =>
                      atualizarCampo("diretorTelefone", event.target.value)
                    }
                    placeholder="(31) 99999-9999"
                  />
                </label>
              </div>

              <div className="escola-form-duplo">
                <label>
                  Senha do diretor
                  <input
                    type="text"
                    value={form.diretorSenha}
                    onChange={(event) =>
                      atualizarCampo("diretorSenha", event.target.value)
                    }
                    placeholder="Senha"
                  />
                </label>
              </div>

              <label>
                Status
                <select
                  value={form.status}
                  onChange={(event) => atualizarCampo("status", event.target.value)}
                >
                  <option value="ativo">Ativa</option>
                  <option value="inativo">Inativa</option>
                </select>
              </label>

              <div className="escola-form-acoes">
                <button type="button" onClick={limparFormulario}>
                  {form.id ? "Cancelar edicao" : "Limpar"}
                </button>
                <button type="submit" disabled={salvando}>
                  {salvando
                    ? "Salvando..."
                    : form.id
                      ? "Atualizar escola"
                      : usarSupabase
                        ? "Criar escola e direcao"
                        : "Salvar escola"}
                </button>
              </div>
            </form>

            <section className="escolas-lista" aria-label="Escolas cadastradas">
              {escolas.length === 0 ? (
                <div className="escolas-vazio">Nenhuma escola cadastrada.</div>
              ) : (
                escolas.map((escola) => (
                  <article
                    className={`escola-item ${
                      escola.status === "inativo" ? "escola-inativa" : ""
                    } ${form.id === escola.id ? "escola-em-edicao" : ""}`}
                    key={escola.id}
                  >
                    <div className="escola-item-topo">
                      <div>
                        <h2>{escola.nome}</h2>
                        <p>{escola.cidade || "Sem observacao"}</p>
                      </div>

                      <span>{escola.status === "inativo" ? "Inativa" : "Ativa"}</span>
                    </div>

                    <dl>
                      <div>
                        <dt>Diretor</dt>
                        <dd>{escola.diretorNome || "-"}</dd>
                      </div>
                      <div>
                        <dt>Usuario</dt>
                        <dd>{escola.diretorLogin || "-"}</dd>
                      </div>
                      <div>
                        <dt>Email</dt>
                        <dd>{escola.diretorEmail || "-"}</dd>
                      </div>
                      <div>
                        <dt>WhatsApp</dt>
                        <dd>{escola.diretorTelefone || "-"}</dd>
                      </div>
                    </dl>

                    <div className="escola-item-acoes">
                      <button type="button" onClick={() => editarEscola(escola)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => alternarStatus(escola.id)}>
                        {escola.status === "inativo" ? "Ativar" : "Inativar"}
                      </button>
                      <button type="button" onClick={() => excluirEscola(escola.id)}>
                        Excluir
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

export default Escolas;

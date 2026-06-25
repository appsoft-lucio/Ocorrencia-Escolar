import "./Escolas.css";

import { useEffect, useMemo, useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  carregarEscolasSistema,
  salvarEscolasSistema,
} from "../../data/demoUsers";

const FORM_INICIAL = {
  id: null,
  nome: "",
  cidade: "",
  diretorNome: "",
  diretorLogin: "",
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
  const [escolas, setEscolas] = useState(carregarEscolasSistema);
  const [form, setForm] = useState(FORM_INICIAL);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    salvarEscolasSistema(escolas);
  }, [escolas]);

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
  }

  function editarEscola(escola) {
    setForm({
      id: escola.id,
      nome: escola.nome,
      cidade: escola.cidade || "",
      diretorNome: escola.diretorNome || "",
      diretorLogin: escola.diretorLogin || "",
      diretorSenha: escola.diretorSenha || "",
      status: escola.status || "ativo",
    });
    setMensagem("");
  }

  function salvarEscola(event) {
    event.preventDefault();

    if (!form.nome.trim()) {
      setMensagem("Informe o nome da escola.");
      return;
    }

    if (!form.diretorNome.trim()) {
      setMensagem("Informe o nome do diretor.");
      return;
    }

    if (!form.diretorLogin.trim() || !form.diretorSenha.trim()) {
      setMensagem("Informe login e senha do diretor.");
      return;
    }

    const id = form.id || criarIdEscola(form.nome);
    const loginEmUso = escolas.some(
      (escola) =>
        escola.id !== id &&
        escola.diretorLogin.trim().toLowerCase() ===
          form.diretorLogin.trim().toLowerCase(),
    );

    if (loginEmUso) {
      setMensagem("Este login de diretor ja esta em uso.");
      return;
    }

    const escolaAtualizada = {
      id,
      nome: form.nome.trim(),
      cidade: form.cidade.trim(),
      diretorNome: form.diretorNome.trim(),
      diretorLogin: form.diretorLogin.trim(),
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

    setMensagem("Escola salva com sucesso.");
    setForm(FORM_INICIAL);
  }

  function alternarStatus(escolaId) {
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
            <form className="escola-form" onSubmit={salvarEscola}>
              <h2>{form.id ? "Editar escola" : "Nova escola"}</h2>

              {mensagem && <div className="escola-mensagem">{mensagem}</div>}

              <label>
                Nome da escola
                <input
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

              <div className="escola-form-duplo">
                <label>
                  Login do diretor
                  <input
                    value={form.diretorLogin}
                    onChange={(event) =>
                      atualizarCampo("diretorLogin", event.target.value)
                    }
                    placeholder="login-diretor"
                  />
                </label>

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
                  Limpar
                </button>
                <button type="submit">Salvar escola</button>
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
                    }`}
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
                        <dt>Login</dt>
                        <dd>{escola.diretorLogin || "-"}</dd>
                      </div>
                    </dl>

                    <div className="escola-item-acoes">
                      <button type="button" onClick={() => editarEscola(escola)}>
                        Editar
                      </button>
                      <button type="button" onClick={() => alternarStatus(escola.id)}>
                        {escola.status === "inativo" ? "Ativar" : "Inativar"}
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

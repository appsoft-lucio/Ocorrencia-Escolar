import "./coordenador.css";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import {
  atualizarStatusTipoOcorrenciaSupabase,
  atualizarStatusTurmaSupabase,
  criarTipoOcorrenciaSupabase,
  criarTurmaSupabase,
  listarTiposOcorrenciaSupabase,
  listarTurmasSupabase,
} from "../../services/cadastrosEscolaresService";

const TIPOS_OCORRENCIA_PADRAO = [
  "Indisciplina",
  "Atraso",
  "Falta de material",
  "Desrespeito",
  "Briga",
  "Uso de celular",
  "Outro",
];

const TURMAS_PADRAO = [
  "101",
  "102",
  "103",
  "201",
  "202",
  "203",
  "301",
  "302",
  "303",
  "401",
  "402",
  "403",
  "501",
  "502",
  "503",
  "601",
  "602",
  "603",
  "701",
  "702",
  "703",
  "801",
  "802",
  "803",
  "901",
  "902",
  "903",
  "1001",
  "1002",
  "1003",
  "2001",
  "2002",
  "2003",
  "3001",
  "3002",
  "3003",
];

function criarTipoOcorrencia(nome) {
  return {
    id: `${nome}-${Date.now()}`,
    nome,
    status: "ativo",
    criadoEm: new Date().toISOString(),
    desativadoEm: null,
  };
}

function criarTurmaEscolar(nome) {
  return {
    id: `${nome}-${Date.now()}`,
    nome,
    status: "ativo",
    criadoEm: new Date().toISOString(),
    desativadoEm: null,
  };
}

function normalizarTipoOcorrencia(tipo) {
  if (typeof tipo === "string") {
    return {
      id: tipo,
      nome: tipo,
      status: "ativo",
      criadoEm: null,
      desativadoEm: null,
    };
  }

  return {
    ...tipo,
    id: tipo.id || tipo.nome || String(Date.now()),
    nome: tipo.nome || "",
    status: tipo.status || "ativo",
    criadoEm: tipo.criadoEm || null,
    desativadoEm: tipo.desativadoEm || null,
  };
}

function carregarTiposOcorrencia() {
  const stored = localStorage.getItem("tiposOcorrencia");

  if (!stored) {
    return TIPOS_OCORRENCIA_PADRAO.map(criarTipoOcorrencia);
  }

  try {
    return JSON.parse(stored).map(normalizarTipoOcorrencia);
  } catch (error) {
    console.error("Erro ao carregar tipos de ocorrência:", error);
    return TIPOS_OCORRENCIA_PADRAO.map(criarTipoOcorrencia);
  }
}

function normalizarTurmaEscolar(turma) {
  if (typeof turma === "string") {
    return {
      id: turma,
      nome: turma,
      status: "ativo",
      criadoEm: null,
      desativadoEm: null,
    };
  }

  return {
    ...turma,
    id: turma.id || turma.nome || String(Date.now()),
    nome: turma.nome || turma.codigo || "",
    status: turma.status || "ativo",
    criadoEm: turma.criadoEm || null,
    desativadoEm: turma.desativadoEm || null,
  };
}

function carregarTurmasEscolares() {
  const stored = localStorage.getItem("turmasEscolares");

  if (!stored) {
    return TURMAS_PADRAO.map(criarTurmaEscolar);
  }

  try {
    return JSON.parse(stored).map(normalizarTurmaEscolar);
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    return TURMAS_PADRAO.map(criarTurmaEscolar);
  }
}

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function Coordenador() {
  const { user } = useContext(AuthContext);
  const usarSupabase = user?.origem === "supabase";
  const coordenadoresStorageKey = criarChaveEscola("coordenadores", user?.escolaId);
  const tiposStorageKey = criarChaveEscola("tiposOcorrencia", user?.escolaId);
  const turmasStorageKey = criarChaveEscola("turmasEscolares", user?.escolaId);

  const [coordenadores, setCoordenadores] = useState(() => {
    const stored = localStorage.getItem(coordenadoresStorageKey);
    return stored ? JSON.parse(stored) : [];
  });

  const [nome, setNome] = useState("");
  const [principal, setPrincipal] = useState(coordenadores.length === 0);
  const [mensagem, setMensagem] = useState("");
  const [tiposOcorrencia, setTiposOcorrencia] = useState(() => {
    const stored = localStorage.getItem(tiposStorageKey);
    return stored
      ? JSON.parse(stored).map(normalizarTipoOcorrencia)
      : TIPOS_OCORRENCIA_PADRAO.map(criarTipoOcorrencia);
  });
  const [turmasEscolares, setTurmasEscolares] = useState(() => {
    const stored = localStorage.getItem(turmasStorageKey);
    return stored
      ? JSON.parse(stored).map(normalizarTurmaEscolar)
      : TURMAS_PADRAO.map(criarTurmaEscolar);
  });
  const [abrirModalTipos, setAbrirModalTipos] = useState(false);
  const [abrirModalTurmas, setAbrirModalTurmas] = useState(false);
  const [novoTipo, setNovoTipo] = useState("");
  const [novaTurma, setNovaTurma] = useState("");
  const [mensagemTipo, setMensagemTipo] = useState("");
  const [mensagemTurma, setMensagemTurma] = useState("");

  useEffect(() => {
    let ativo = true;

    if (!usarSupabase || !user?.escolaId) return undefined;

    Promise.all([
      listarTiposOcorrenciaSupabase(user),
      listarTurmasSupabase(user),
    ])
      .then(([tipos, turmas]) => {
        if (!ativo) return;
        setTiposOcorrencia(tipos);
        setTurmasEscolares(turmas);
      })
      .catch((error) => {
        console.error("Erro ao carregar cadastros no Supabase:", error);
        if (ativo) {
          setMensagemTipo("Nao foi possivel carregar tipos do Supabase.");
          setMensagemTurma("Nao foi possivel carregar turmas do Supabase.");
        }
      });

    return () => {
      ativo = false;
    };
  }, [usarSupabase, user]);

  const coordenadorPrincipal = useMemo(
    () => coordenadores.find((coordenador) => coordenador.principal),
    [coordenadores],
  );

  const tiposAtivos = useMemo(
    () => tiposOcorrencia.filter((tipo) => tipo.status !== "inativo"),
    [tiposOcorrencia],
  );

  const tiposInativos = tiposOcorrencia.length - tiposAtivos.length;

  const turmasAtivas = useMemo(
    () => turmasEscolares.filter((turma) => turma.status !== "inativo"),
    [turmasEscolares],
  );

  const turmasInativas = turmasEscolares.length - turmasAtivas.length;

  useEffect(() => {
    localStorage.setItem(coordenadoresStorageKey, JSON.stringify(coordenadores));
  }, [coordenadores, coordenadoresStorageKey]);

  useEffect(() => {
    if (usarSupabase) return;
    localStorage.setItem(tiposStorageKey, JSON.stringify(tiposOcorrencia));
  }, [tiposOcorrencia, tiposStorageKey, usarSupabase]);

  useEffect(() => {
    if (usarSupabase) return;
    localStorage.setItem(turmasStorageKey, JSON.stringify(turmasEscolares));
  }, [turmasEscolares, turmasStorageKey, usarSupabase]);

  const adicionar = () => {
    if (!nome.trim()) {
      setMensagem("Informe o nome do coordenador.");
      return;
    }

    const novo = {
      id: Date.now(),
      nome: nome.trim(),
      principal: principal || coordenadores.length === 0,
    };

    const atualizados = novo.principal
      ? coordenadores
          .map((coordenador) => ({ ...coordenador, principal: false }))
          .concat(novo)
      : coordenadores.concat(novo);

    setCoordenadores(atualizados);
    setNome("");
    setPrincipal(false);
    setMensagem("Coordenador adicionado com sucesso.");
    setTimeout(() => setMensagem(""), 2000);
  };

  const remover = (id) => {
    if (!window.confirm("Remover este coordenador?")) return;

    setCoordenadores((prev) => prev.filter((coordenador) => coordenador.id !== id));
  };

  const tornarPrincipal = (id) => {
    setCoordenadores((prev) =>
      prev.map((coordenador) => ({
        ...coordenador,
        principal: coordenador.id === id,
      })),
    );
  };

  const adicionarTipoOcorrencia = async () => {
    const nomeTipo = novoTipo.trim();

    if (!nomeTipo) {
      setMensagemTipo("Informe o nome do tipo de ocorrência.");
      return;
    }

    const tipoExistente = tiposOcorrencia.find(
      (tipo) => tipo.nome.toLowerCase() === nomeTipo.toLowerCase(),
    );

    if (tipoExistente?.status === "ativo") {
      setMensagemTipo("Este tipo de ocorrência já está ativo.");
      return;
    }
    if (usarSupabase) {
      if (tipoExistente) {
        const tipoAtualizado = await atualizarStatusTipoOcorrenciaSupabase(
          tipoExistente.id,
          "ativo",
          user,
        );
        setTiposOcorrencia((prev) =>
          prev.map((tipo) =>
            tipo.id === tipoExistente.id ? tipoAtualizado : tipo,
          ),
        );
        setMensagemTipo("Tipo de ocorrência reativado com sucesso.");
      } else {
        const tipoCriado = await criarTipoOcorrenciaSupabase(user, nomeTipo);
        setTiposOcorrencia((prev) => prev.concat(tipoCriado));
        setMensagemTipo("Tipo de ocorrência adicionado com sucesso.");
      }

      setNovoTipo("");
      setTimeout(() => setMensagemTipo(""), 2000);
      return;
    }

    if (tipoExistente) {
      setTiposOcorrencia((prev) =>
        prev.map((tipo) =>
          tipo.id === tipoExistente.id
            ? { ...tipo, status: "ativo", desativadoEm: null }
            : tipo,
        ),
      );
      setMensagemTipo("Tipo de ocorrência reativado com sucesso.");
    } else {
      setTiposOcorrencia((prev) => prev.concat(criarTipoOcorrencia(nomeTipo)));
      setMensagemTipo("Tipo de ocorrência adicionado com sucesso.");
    }

    setNovoTipo("");
    setTimeout(() => setMensagemTipo(""), 2000);
  };

  const alternarStatusTipo = async (id) => {
    const tipoAtual = tiposOcorrencia.find((tipo) => tipo.id === id);
    if (!tipoAtual) return;

    const tipoEstaInativo = tipoAtual.status === "inativo";
    const novoStatusTipo = tipoEstaInativo ? "ativo" : "inativo";

    if (usarSupabase) {
      const tipoAtualizado = await atualizarStatusTipoOcorrenciaSupabase(
        id,
        novoStatusTipo,
        user,
      );
      setTiposOcorrencia((prev) =>
        prev.map((tipo) => (tipo.id === id ? tipoAtualizado : tipo)),
      );
      return;
    }
    setTiposOcorrencia((prev) =>
      prev.map((tipo) => {
        if (tipo.id !== id) return tipo;

        const estaInativo = tipo.status === "inativo";

        return {
          ...tipo,
          status: estaInativo ? "ativo" : "inativo",
          desativadoEm: estaInativo ? null : new Date().toISOString(),
        };
      }),
    );
  };

  const adicionarTurmaEscolar = async () => {
    const nomeTurma = novaTurma.trim();

    if (!nomeTurma) {
      setMensagemTurma("Informe o nome da turma.");
      return;
    }

    const turmaExistente = turmasEscolares.find(
      (turma) => turma.nome.toLowerCase() === nomeTurma.toLowerCase(),
    );

    if (turmaExistente?.status === "ativo") {
      setMensagemTurma("Esta turma já está ativa.");
      return;
    }
    if (usarSupabase) {
      if (turmaExistente) {
        const turmaAtualizada = await atualizarStatusTurmaSupabase(
          turmaExistente.id,
          "ativo",
          user,
        );
        setTurmasEscolares((prev) =>
          prev.map((turma) =>
            turma.id === turmaExistente.id ? turmaAtualizada : turma,
          ),
        );
        setMensagemTurma("Turma reativada com sucesso.");
      } else {
        const turmaCriada = await criarTurmaSupabase(user, nomeTurma);
        setTurmasEscolares((prev) => prev.concat(turmaCriada));
        setMensagemTurma("Turma adicionada com sucesso.");
      }

      setNovaTurma("");
      setTimeout(() => setMensagemTurma(""), 2000);
      return;
    }

    if (turmaExistente) {
      setTurmasEscolares((prev) =>
        prev.map((turma) =>
          turma.id === turmaExistente.id
            ? { ...turma, status: "ativo", desativadoEm: null }
            : turma,
        ),
      );
      setMensagemTurma("Turma reativada com sucesso.");
    } else {
      setTurmasEscolares((prev) => prev.concat(criarTurmaEscolar(nomeTurma)));
      setMensagemTurma("Turma adicionada com sucesso.");
    }

    setNovaTurma("");
    setTimeout(() => setMensagemTurma(""), 2000);
  };

  const alternarStatusTurma = async (id) => {
    const turmaAtual = turmasEscolares.find((turma) => turma.id === id);
    if (!turmaAtual) return;

    const turmaEstaInativa = turmaAtual.status === "inativo";
    const novoStatusTurma = turmaEstaInativa ? "ativo" : "inativo";

    if (usarSupabase) {
      const turmaAtualizada = await atualizarStatusTurmaSupabase(
        id,
        novoStatusTurma,
        user,
      );
      setTurmasEscolares((prev) =>
        prev.map((turma) => (turma.id === id ? turmaAtualizada : turma)),
      );
      return;
    }
    setTurmasEscolares((prev) =>
      prev.map((turma) => {
        if (turma.id !== id) return turma;

        const estaInativa = turma.status === "inativo";

        return {
          ...turma,
          status: estaInativa ? "ativo" : "inativo",
          desativadoEm: estaInativa ? null : new Date().toISOString(),
        };
      }),
    );
  };

  return (
    <div className="coordenador-layout">
      <Sidebar />

      <div className="coordenador-main">
        <Header />

        <main className="coordenador-content">
          <div className="coordenador-topo">
            <div>
              <h1>Coordenação</h1>
              <p>Gerencie coordenadores e os tipos usados nas ocorrências.</p>
            </div>

            <div className="coordenador-acoes-topo">
              <button
                type="button"
                className="btn-gerenciar-tipos"
                onClick={() => setAbrirModalTipos(true)}
              >
                Tipos de ocorrência
              </button>
              <button
                type="button"
                className="btn-gerenciar-tipos"
                onClick={() => setAbrirModalTurmas(true)}
              >
                Turmas
              </button>
            </div>
          </div>

          <section className="coordenador-resumo" aria-label="Resumo">
            <div className="resumo-card">
              <strong>{coordenadores.length}</strong>
              <span>Coordenadores</span>
            </div>

            <div className="resumo-card">
              <strong>{coordenadorPrincipal?.nome || "-"}</strong>
              <span>Principal</span>
            </div>

            <div className="resumo-card">
              <strong>{tiposAtivos.length}</strong>
              <span>Tipos ativos</span>
            </div>

            <div className="resumo-card">
              <strong>{turmasAtivas.length}</strong>
              <span>Turmas ativas</span>
            </div>
          </section>

          <div className="coordenador-grid">
            <section className="coordenador-card coordenador-form">
              <div className="secao-titulo">
                <h2>Novo coordenador</h2>
                <p>Cadastre quem acompanha a rotina escolar.</p>
              </div>

              {mensagem && <div className="mensagem">{mensagem}</div>}

              <label htmlFor="nome-coordenador">Nome</label>
              <input
                id="nome-coordenador"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") adicionar();
                }}
                placeholder="Ex: Maria Silva"
              />

              <label className="checkbox-principal">
                <input
                  type="checkbox"
                  checked={principal}
                  onChange={(event) => setPrincipal(event.target.checked)}
                />
                <span>Definir como coordenador principal</span>
              </label>

              <div className="botoes">
                <button type="button" onClick={adicionar}>
                  Adicionar coordenador
                </button>
              </div>
            </section>

            <section className="coordenador-card tipos-card">
              <div className="secao-titulo">
                <h2>Tipos de ocorrência</h2>
                <p>Controle quais tipos aparecem no registro.</p>
              </div>

              <div className="tipos-card-contadores">
                <span>{tiposAtivos.length} ativos</span>
                <span>{tiposInativos} desativados</span>
              </div>

              <button
                type="button"
                className="btn-secundario"
                onClick={() => setAbrirModalTipos(true)}
              >
                Gerenciar tipos
              </button>
            </section>

            <section className="coordenador-card tipos-card">
              <div className="secao-titulo">
                <h2>Turmas</h2>
                <p>Controle as turmas que aparecem no registro.</p>
              </div>

              <div className="tipos-card-contadores">
                <span>{turmasAtivas.length} ativas</span>
                <span>{turmasInativas} desativadas</span>
              </div>

              <button
                type="button"
                className="btn-secundario"
                onClick={() => setAbrirModalTurmas(true)}
              >
                Gerenciar turmas
              </button>
            </section>
          </div>

          <section className="coordenador-card coordenador-lista">
            <div className="secao-titulo">
              <h2>Coordenadores cadastrados</h2>
              <p>Defina o principal ou remova cadastros duplicados.</p>
            </div>

            {coordenadores.length === 0 ? (
              <p className="estado-vazio">Nenhum coordenador cadastrado.</p>
            ) : (
              <ul>
                {coordenadores.map((coordenador) => (
                  <li
                    key={coordenador.id}
                    className={coordenador.principal ? "principal" : ""}
                  >
                    <div>
                      <strong>{coordenador.nome}</strong>
                      {coordenador.principal && <span>Principal</span>}
                    </div>

                    <div className="acoes">
                      {!coordenador.principal && (
                        <button
                          type="button"
                          onClick={() => tornarPrincipal(coordenador.id)}
                        >
                          Tornar principal
                        </button>
                      )}

                      <button type="button" onClick={() => remover(coordenador.id)}>
                        Remover
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>

      {abrirModalTipos && (
        <div className="modal-overlay">
          <div className="modal-tipos">
            <button
              type="button"
              className="btn-fechar-modal"
              onClick={() => setAbrirModalTipos(false)}
              title="Fechar"
            >
              x
            </button>

            <h2>Tipos de ocorrência</h2>

            {mensagemTipo && <div className="mensagem">{mensagemTipo}</div>}

            <div className="tipo-form">
              <label htmlFor="novo-tipo">Novo tipo</label>
              <div>
                <input
                  id="novo-tipo"
                  value={novoTipo}
                  onChange={(event) => setNovoTipo(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") adicionarTipoOcorrencia();
                  }}
                  placeholder="Ex: Falta de uniforme"
                />
                <button type="button" onClick={adicionarTipoOcorrencia}>
                  Adicionar
                </button>
              </div>
            </div>

            <div className="tipos-lista">
              {tiposOcorrencia.map((tipo) => {
                const estaInativo = tipo.status === "inativo";

                return (
                  <div
                    key={tipo.id}
                    className={`tipo-item ${estaInativo ? "tipo-inativo" : ""}`}
                  >
                    <span>
                      {tipo.nome}
                      {estaInativo ? " (desativado)" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => alternarStatusTipo(tipo.id)}
                    >
                      {estaInativo ? "Reativar" : "Desativar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {abrirModalTurmas && (
        <div className="modal-overlay">
          <div className="modal-tipos">
            <button
              type="button"
              className="btn-fechar-modal"
              onClick={() => setAbrirModalTurmas(false)}
              title="Fechar"
            >
              x
            </button>

            <h2>Turmas</h2>

            {mensagemTurma && <div className="mensagem">{mensagemTurma}</div>}

            <div className="tipo-form">
              <label htmlFor="nova-turma">Nova turma</label>
              <div>
                <input
                  id="nova-turma"
                  value={novaTurma}
                  onChange={(event) => setNovaTurma(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") adicionarTurmaEscolar();
                  }}
                  placeholder="Ex: Informática"
                />
                <button type="button" onClick={adicionarTurmaEscolar}>
                  Adicionar
                </button>
              </div>
            </div>

            <div className="tipos-lista">
              {turmasEscolares.map((turma) => {
                const estaInativa = turma.status === "inativo";

                return (
                  <div
                    key={turma.id}
                    className={`tipo-item ${estaInativa ? "tipo-inativo" : ""}`}
                  >
                    <span>
                      {turma.nome}
                      {estaInativa ? " (desativada)" : ""}
                    </span>
                    <button
                      type="button"
                      onClick={() => alternarStatusTurma(turma.id)}
                    >
                      {estaInativa ? "Reativar" : "Desativar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Coordenador;




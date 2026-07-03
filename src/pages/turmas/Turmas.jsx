import "./Turmas.css";

import { useContext, useEffect, useMemo, useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";
import { useProfessores } from "../../hooks/useProfessores";
import {
  atualizarStatusTurmaSupabase,
  criarTurmaSupabase,
  listarTurmasSupabase,
} from "../../services/cadastrosEscolaresService";
import { normalizarPerfil, perfilGestao } from "../../utils/permissoes";

const TURNOS = ["Manha", "Tarde", "Noite", "Integral"];

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function normalizarTexto(valor = "") {
  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarTurmaProfessor(turma) {
  if (typeof turma === "string") {
    return { codigo: turma, status: "ativo" };
  }

  return {
    codigo: turma?.codigo || turma?.nome || "",
    status: turma?.status || "ativo",
  };
}

function obterTurmasProfessor(professor) {
  return (professor?.turmas || [])
    .map(normalizarTurmaProfessor)
    .filter((turma) => turma.codigo && turma.status !== "inativo");
}

function contarPor(lista, obterValores) {
  const mapa = new Map();

  lista.forEach((item) => {
    const valores = obterValores(item);
    const listaValores = Array.isArray(valores) ? valores : [valores];

    listaValores.filter(Boolean).forEach((valor) => {
      mapa.set(valor, (mapa.get(valor) || 0) + 1);
    });
  });

  return Array.from(mapa, ([nome, total]) => ({ nome, total })).sort(
    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

function lerTurmasLocais(escolaId) {
  try {
    const valor = localStorage.getItem(criarChaveEscola("turmas", escolaId));
    const turmas = valor ? JSON.parse(valor) : [];
    return Array.isArray(turmas) ? turmas : [];
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    return [];
  }
}

function salvarTurmasLocais(escolaId, turmas) {
  localStorage.setItem(
    criarChaveEscola("turmas", escolaId),
    JSON.stringify(turmas),
  );
}

function Turmas() {
  const { user } = useContext(AuthContext);
  const { ocorrencias } = useContext(OcorrenciaContext);
  const { professores } = useProfessores(user);
  const [turmasCadastradas, setTurmasCadastradas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [filtros, setFiltros] = useState({
    busca: "",
    turno: "",
    status: "",
  });
  const [form, setForm] = useState({
    codigo: "",
    turno: "Manha",
  });

  const perfil = normalizarPerfil(user?.role);
  const isGestao = perfilGestao(perfil);
  const podeCadastrar = isGestao;
  const isDiretor = ["diretor", "direcao"].includes(perfil);
  const isProfessor = perfil === "professor";
  const isSupTurno = ["vice_diretor", "coordenador", "coordenacao"].includes(perfil);
  const usarSupabase = user?.origem === "supabase";

  useEffect(() => {
    let ativo = true;

    if (!user?.escolaId) {
      setTurmasCadastradas([]);
      return undefined;
    }

    if (!usarSupabase) {
      setTurmasCadastradas(lerTurmasLocais(user.escolaId));
      return undefined;
    }

    setLoading(true);
    listarTurmasSupabase(user)
      .then((dados) => {
        if (ativo) setTurmasCadastradas(dados);
      })
      .catch((error) => {
        console.error("Erro ao carregar turmas:", error);
        if (ativo) {
          setMensagem("Nao foi possivel carregar turmas do Supabase.");
        }
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [usarSupabase, user]);

  const professoresComTurmas = useMemo(() => {
    const mapaOcorrencias = new Map();

    ocorrencias.forEach((ocorrencia) => {
      const chave = ocorrencia.professorId || normalizarTexto(ocorrencia.professorNome);
      if (!chave) return;

      const atual = mapaOcorrencias.get(chave) || {
        turmas: new Set(),
        turnos: new Set(),
      };

      if (ocorrencia.turma) atual.turmas.add(ocorrencia.turma);
      if (ocorrencia.turno) atual.turnos.add(ocorrencia.turno);
      mapaOcorrencias.set(chave, atual);
    });

    return professores.map((professor) => {
      const porId = mapaOcorrencias.get(professor.id);
      const porNome = mapaOcorrencias.get(normalizarTexto(professor.nome));
      const turmasOcorrencias = [...(porId?.turmas || []), ...(porNome?.turmas || [])];
      const turnosOcorrencias = [...(porId?.turnos || []), ...(porNome?.turnos || [])];
      const turmasProfessor = obterTurmasProfessor(professor).map(
        (turma) => turma.codigo,
      );

      return {
        ...professor,
        turmasResumo: Array.from(new Set([...turmasProfessor, ...turmasOcorrencias])),
        turnosResumo: Array.from(
          new Set([professor.turno, ...turnosOcorrencias].filter(Boolean)),
        ),
      };
    });
  }, [ocorrencias, professores]);

  const turnosPermitidos = useMemo(() => {
    if (!isSupTurno) return null;

    const turnos = new Set();

    professoresComTurmas.forEach((professor) => {
      const mesmoUsuario =
        professor.id === user?.id ||
        normalizarTexto(professor.nome) === normalizarTexto(user?.nome);

      if (mesmoUsuario) {
        professor.turnosResumo.forEach((turno) => turnos.add(turno));
      }
    });

    return turnos.size ? turnos : null;
  }, [isSupTurno, professoresComTurmas, user]);

  const turmas = useMemo(() => {
    const mapa = new Map();

    function garantirTurma(codigo, dados = {}) {
      if (!codigo) return null;

      const atual = mapa.get(codigo) || {
        id: dados.id || codigo,
        codigo,
        turno: dados.turno || "",
        status: dados.status || "ativo",
        cadastrado: Boolean(dados.cadastrado),
        professores: new Set(),
        ocorrencias: [],
      };

      mapa.set(codigo, {
        ...atual,
        id: dados.id || atual.id,
        turno: dados.turno || atual.turno,
        status: dados.status || atual.status,
        cadastrado: dados.cadastrado || atual.cadastrado,
      });

      return mapa.get(codigo);
    }

    turmasCadastradas.forEach((turma) => {
      garantirTurma(turma.codigo || turma.nome, {
        id: turma.id,
        turno: turma.turno,
        status: turma.status,
        cadastrado: true,
      });
    });

    professoresComTurmas.forEach((professor) => {
      professor.turmasResumo.forEach((codigo) => {
        const turma = garantirTurma(codigo, {
          turno: professor.turnosResumo[0] || "",
        });

        if (turma) turma.professores.add(professor.nome);
      });
    });

    ocorrencias.forEach((ocorrencia) => {
      const turma = garantirTurma(ocorrencia.turma, {
        turno: ocorrencia.turno,
      });

      if (!turma) return;
      turma.ocorrencias.push(ocorrencia);
      if (ocorrencia.professorNome) turma.professores.add(ocorrencia.professorNome);
      if (!turma.turno && ocorrencia.turno) turma.turno = ocorrencia.turno;
    });

    return Array.from(mapa.values())
      .map((turma) => {
        const alunos = new Set(
          turma.ocorrencias.flatMap((ocorrencia) => ocorrencia.alunos || []),
        );
        const tipos = contarPor(turma.ocorrencias, (ocorrencia) => ocorrencia.tipos || []);
        const pendentes = turma.ocorrencias.filter(
          (ocorrencia) => normalizarTexto(ocorrencia.status) === "pendente",
        ).length;
        const totalOcorrencias = turma.ocorrencias.length;
        const situacao =
          totalOcorrencias >= 8 || pendentes >= 4
            ? "Critica"
            : totalOcorrencias >= 3 || pendentes >= 1
              ? "Atencao"
              : "Estavel";

        return {
          ...turma,
          alunos: alunos.size,
          professores: Array.from(turma.professores).sort((a, b) =>
            a.localeCompare(b, "pt-BR"),
          ),
          tipos,
          pendentes,
          totalOcorrencias,
          situacao,
        };
      })
      .sort((a, b) => a.codigo.localeCompare(b.codigo, "pt-BR", { numeric: true }));
  }, [ocorrencias, professoresComTurmas, turmasCadastradas]);

  const turmasVisiveis = useMemo(() => {
    if (!user) return [];

    let lista = turmas;

    if (isProfessor) {
      const professorAtual = professoresComTurmas.find(
        (professor) =>
          professor.id === user.id ||
          normalizarTexto(professor.nome) === normalizarTexto(user.nome),
      );
      const turmasDoProfessor = new Set(professorAtual?.turmasResumo || []);
      const turmasComOcorrencia = new Set(
        ocorrencias
          .filter(
            (ocorrencia) =>
              ocorrencia.professorId === user.id ||
              normalizarTexto(ocorrencia.professorNome) === normalizarTexto(user.nome),
          )
          .map((ocorrencia) => ocorrencia.turma)
          .filter(Boolean),
      );

      lista = lista.filter(
        (turma) =>
          turmasDoProfessor.has(turma.codigo) || turmasComOcorrencia.has(turma.codigo),
      );
    } else if (!isDiretor && turnosPermitidos) {
      lista = lista.filter((turma) => turnosPermitidos.has(turma.turno));
    }

    const termo = normalizarTexto(filtros.busca);

    return lista.filter((turma) => {
      const buscaOk =
        !termo ||
        normalizarTexto(turma.codigo).includes(termo) ||
        turma.professores.some((professor) => normalizarTexto(professor).includes(termo));
      const turnoOk = !filtros.turno || turma.turno === filtros.turno;
      const statusOk = !filtros.status || turma.status === filtros.status;

      return buscaOk && turnoOk && statusOk;
    });
  }, [
    filtros,
    isDiretor,
    isProfessor,
    ocorrencias,
    professoresComTurmas,
    turmas,
    turnosPermitidos,
    user,
  ]);

  const resumo = useMemo(
    () => ({
      total: turmasVisiveis.length,
      ativas: turmasVisiveis.filter((turma) => turma.status !== "inativo").length,
      atencao: turmasVisiveis.filter((turma) => turma.situacao === "Atencao").length,
      criticas: turmasVisiveis.filter((turma) => turma.situacao === "Critica").length,
    }),
    [turmasVisiveis],
  );

  const turnosDisponiveis = useMemo(
    () =>
      Array.from(new Set(turmas.map((turma) => turma.turno).filter(Boolean))).sort(),
    [turmas],
  );

  function atualizarFiltro(campo, valor) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function atualizarForm(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
    setMensagem("");
  }

  async function salvarTurma(event) {
    event.preventDefault();

    if (!podeCadastrar) return;

    const codigo = form.codigo.trim();

    if (!codigo) {
      setMensagem("Informe o codigo da turma.");
      return;
    }

    if (
      turmas.some((turma) => normalizarTexto(turma.codigo) === normalizarTexto(codigo))
    ) {
      setMensagem("Esta turma ja existe.");
      return;
    }

    try {
      if (usarSupabase) {
        const turmaCriada = await criarTurmaSupabase(user, codigo, form.turno);
        setTurmasCadastradas((atuais) => [...atuais, turmaCriada]);
      } else {
        const novaTurma = {
          id: `${codigo}-${Date.now()}`,
          codigo,
          nome: codigo,
          turno: form.turno,
          status: "ativo",
        };
        const proximas = [...turmasCadastradas, novaTurma];
        setTurmasCadastradas(proximas);
        salvarTurmasLocais(user.escolaId, proximas);
      }

      setForm({ codigo: "", turno: "Manha" });
      setMensagem("Turma cadastrada com sucesso.");
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel cadastrar a turma.");
    }
  }

  async function alternarStatus(turma) {
    if (!podeCadastrar) return;

    const novoStatus = turma.status === "inativo" ? "ativo" : "inativo";

    try {
      if (usarSupabase && turma.id) {
        const atualizada = await atualizarStatusTurmaSupabase(turma.id, novoStatus, user);
        setTurmasCadastradas((atuais) =>
          atuais.map((item) => (item.id === turma.id ? atualizada : item)),
        );
      } else {
        const proximas = turmasCadastradas.map((item) =>
          (item.codigo || item.nome) === turma.codigo
            ? { ...item, status: novoStatus }
            : item,
        );
        setTurmasCadastradas(proximas);
        salvarTurmasLocais(user.escolaId, proximas);
      }
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel atualizar a turma.");
    }
  }

  if (!user) {
    return <div className="turmas-feedback">Carregando usuario...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Header />

        <main className="turmas-container">
          <section className="turmas-topo">
            <div>
              <h1>Turmas</h1>
              <p>
                Acompanhe registros, alunos envolvidos e situacao das turmas da escola.
              </p>
            </div>
          </section>

          <section className="turmas-resumo" aria-label="Resumo das turmas">
            <div>
              <strong>{resumo.total}</strong>
              <span>Turmas visiveis</span>
            </div>
            <div>
              <strong>{resumo.ativas}</strong>
              <span>Ativas</span>
            </div>
            <div>
              <strong>{resumo.atencao}</strong>
              <span>Em atencao</span>
            </div>
            <div>
              <strong>{resumo.criticas}</strong>
              <span>Criticas</span>
            </div>
          </section>

          <section className="turmas-painel">
            {podeCadastrar && (
              <form className="turmas-form" onSubmit={salvarTurma}>
                <h2>Nova turma</h2>

                {mensagem && <div className="turmas-mensagem">{mensagem}</div>}

                <label>
                  Codigo da turma
                  <input
                    value={form.codigo}
                    onChange={(event) => atualizarForm("codigo", event.target.value)}
                    placeholder="Ex: 101"
                  />
                </label>

                <label>
                  Turno
                  <select
                    value={form.turno}
                    onChange={(event) => atualizarForm("turno", event.target.value)}
                  >
                    {TURNOS.map((turno) => (
                      <option key={turno} value={turno}>
                        {turno}
                      </option>
                    ))}
                  </select>
                </label>

                <button type="submit">Cadastrar turma</button>
              </form>
            )}

            <section className="turmas-listagem">
              <div className="turmas-filtros">
                <label>
                  Buscar
                  <input
                    type="search"
                    value={filtros.busca}
                    onChange={(event) => atualizarFiltro("busca", event.target.value)}
                    placeholder="Turma ou professor"
                  />
                </label>

                <label>
                  Turno
                  <select
                    value={filtros.turno}
                    onChange={(event) => atualizarFiltro("turno", event.target.value)}
                  >
                    <option value="">Todos</option>
                    {[...new Set([...TURNOS, ...turnosDisponiveis])].map((turno) => (
                      <option key={turno} value={turno}>
                        {turno}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Status
                  <select
                    value={filtros.status}
                    onChange={(event) => atualizarFiltro("status", event.target.value)}
                  >
                    <option value="">Todos</option>
                    <option value="ativo">Ativas</option>
                    <option value="inativo">Inativas</option>
                  </select>
                </label>
              </div>

              {loading ? (
                <div className="turmas-vazio">Carregando turmas...</div>
              ) : turmasVisiveis.length === 0 ? (
                <div className="turmas-vazio">Nenhuma turma encontrada.</div>
              ) : (
                <div className="turmas-grid">
                  {turmasVisiveis.map((turma) => (
                    <article className="turma-card" key={turma.codigo}>
                      <div className="turma-card-topo">
                        <div>
                          <h2>{turma.codigo}</h2>
                          <span>{turma.turno || "Turno nao informado"}</span>
                        </div>

                        <strong className={`situacao-${normalizarTexto(turma.situacao)}`}>
                          {turma.situacao}
                        </strong>
                      </div>

                      <dl className="turma-metricas">
                        <div>
                          <dt>Ocorrencias</dt>
                          <dd>{turma.totalOcorrencias}</dd>
                        </div>
                        <div>
                          <dt>Pendentes</dt>
                          <dd>{turma.pendentes}</dd>
                        </div>
                        <div>
                          <dt>Alunos</dt>
                          <dd>{turma.alunos}</dd>
                        </div>
                        <div>
                          <dt>Professores</dt>
                          <dd>{turma.professores.length}</dd>
                        </div>
                      </dl>

                      <div className="turma-detalhes">
                        <div>
                          <h3>Professores</h3>
                          <p>
                            {turma.professores.slice(0, 4).join(", ") ||
                              "Nenhum professor vinculado"}
                          </p>
                        </div>

                        <div>
                          <h3>Tipos mais comuns</h3>
                          <p>
                            {turma.tipos
                              .slice(0, 3)
                              .map((tipo) => `${tipo.nome} (${tipo.total})`)
                              .join(", ") || "Sem ocorrencias"}
                          </p>
                        </div>
                      </div>

                      {podeCadastrar && turma.cadastrado && (
                        <div className="turma-acoes">
                          <button type="button" onClick={() => alternarStatus(turma)}>
                            {turma.status === "inativo" ? "Ativar" : "Inativar"}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Turmas;

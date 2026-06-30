import "./Dashboard.css";

import { useContext, useEffect, useMemo, useState } from "react";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import StatsCard from "../../components/Cards/Card";
import { AuthContext } from "../../context/AuthContext.jsx";
import { OcorrenciaContext } from "../../context/OcorrenciaContext.jsx";
import {
  listarTiposOcorrenciaSupabase,
  listarTurmasSupabase,
} from "../../services/cadastrosEscolaresService";

const GESTAO_ROLES = ["diretor", "direcao", "vice_diretor", "coordenador", "coordenacao"];

function lerStorage(chave, fallback = []) {
  try {
    const valor = localStorage.getItem(chave);
    if (!valor) return fallback;

    const parsed = JSON.parse(valor);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    console.error(`Erro ao carregar ${chave}:`, error);
    return fallback;
  }
}

function normalizarTexto(valor = "") {
  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizarTurmasProfessor(turmas = []) {
  return turmas
    .map((turma) => {
      if (typeof turma === "string") return turma;
      return turma.codigo || turma.nome || "";
    })
    .filter(Boolean);
}

function perfilGestao(role) {
  return GESTAO_ROLES.includes(normalizarTexto(role));
}

function nomePerfil(role) {
  if (["diretor", "direcao"].includes(normalizarTexto(role))) return "Diretor";
  if (normalizarTexto(role) === "vice_diretor") return "Vice-diretor";
  if (perfilGestao(role)) return "Coordenação";
  return "Professor";
}

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function dataParaOrdenacao(data) {
  if (!data) return 0;

  const valor = new Date(data).getTime();
  if (!Number.isNaN(valor)) return valor;

  const [dataParte] = data.split(",");
  const partes = dataParte.trim().split(/[/-]/);
  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes;
  return new Date(`${ano}-${mes}-${dia}`).getTime() || 0;
}

function Dashboard() {
  const { user } = useContext(AuthContext);
  const { ocorrencias } = useContext(OcorrenciaContext);
  const [cadastrosSupabase, setCadastrosSupabase] = useState({
    tipos: [],
    turmas: [],
  });

  useEffect(() => {
    let ativo = true;

    if (user?.origem !== "supabase" || !user?.escolaId) {
      setCadastrosSupabase({ tipos: [], turmas: [] });
      return undefined;
    }

    Promise.all([
      listarTiposOcorrenciaSupabase(user.escolaId),
      listarTurmasSupabase(user.escolaId),
    ])
      .then(([tipos, turmas]) => {
        if (ativo) {
          setCadastrosSupabase({ tipos, turmas });
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar cadastros da dashboard:", error);
        if (ativo) {
          setCadastrosSupabase({ tipos: [], turmas: [] });
        }
      });

    return () => {
      ativo = false;
    };
  }, [user?.escolaId, user?.origem]);

  const dadosDashboard = useMemo(() => {
    if (!user) return null;

    const professores = lerStorage(criarChaveEscola("professores", user.escolaId));
    const turmasEscolares =
      user.origem === "supabase"
        ? cadastrosSupabase.turmas
        : lerStorage(criarChaveEscola("turmasEscolares", user.escolaId));
    const tiposOcorrencia =
      user.origem === "supabase"
        ? cadastrosSupabase.tipos
        : lerStorage(criarChaveEscola("tiposOcorrencia", user.escolaId));
    const isGestao = perfilGestao(user.role);
    const nomeUsuario = normalizarTexto(user.nome);

    const professorAtual = professores.find((professor) => {
      const mesmoId = professor.id === user.id;
      const mesmoNome = normalizarTexto(professor.nome) === nomeUsuario;
      return mesmoId || mesmoNome;
    });

    const turmasDoProfessor = new Set(
      normalizarTurmasProfessor(professorAtual?.turmas),
    );

    const ocorrenciasVisiveis = isGestao
      ? ocorrencias
      : ocorrencias.filter((ocorrencia) => {
          const mesmoProfessorId = ocorrencia.professorId === user.id;
          const mesmoProfessorNome =
            normalizarTexto(ocorrencia.professorNome) === nomeUsuario;
          const turmaDoProfessor = turmasDoProfessor.has(ocorrencia.turma);

          return mesmoProfessorId || mesmoProfessorNome || turmaDoProfessor;
        });

    const alunosUnicos = new Set(
      ocorrenciasVisiveis.flatMap((ocorrencia) => ocorrencia.alunos || []),
    );
    const turmasComOcorrencia = new Set(
      ocorrenciasVisiveis.map((ocorrencia) => ocorrencia.turma).filter(Boolean),
    );
    const tiposUsados = new Set(
      ocorrenciasVisiveis.flatMap((ocorrencia) => ocorrencia.tipos || []),
    );
    const pendentes = ocorrenciasVisiveis.filter((ocorrencia) =>
      ["pendente", "aberta"].includes(normalizarTexto(ocorrencia.status || "")),
    );

    const professoresAtivos = professores.filter(
      (professor) => professor.status !== "inativo",
    );
    const turmasAtivas = turmasEscolares.filter(
      (turma) => (turma.status || "ativo") !== "inativo",
    );
    const tiposAtivos = tiposOcorrencia.filter(
      (tipo) => (tipo.status || "ativo") !== "inativo",
    );

    const cards = isGestao
      ? [
          {
            title: "Ocorrências registradas",
            value: ocorrenciasVisiveis.length,
            icon: "📝",
          },
          { title: "Alunos envolvidos", value: alunosUnicos.size, icon: "👥" },
          { title: "Turmas ativas", value: turmasAtivas.length, icon: "🏫" },
          {
            title: "Professores ativos",
            value: professoresAtivos.length,
            icon: "👨‍🏫",
          },
          { title: "Tipos ativos", value: tiposAtivos.length, icon: "🏷️" },
          {
            title: "Ocorrências pendentes",
            value: pendentes.length,
            icon: "⚠️",
          },
        ]
      : [
          {
            title: "Minhas ocorrências",
            value: ocorrenciasVisiveis.length,
            icon: "📝",
          },
          { title: "Alunos envolvidos", value: alunosUnicos.size, icon: "👥" },
          {
            title: "Minhas turmas",
            value: turmasDoProfessor.size || turmasComOcorrencia.size,
            icon: "🏫",
          },
          { title: "Tipos usados", value: tiposUsados.size, icon: "🏷️" },
          {
            title: "Ocorrências pendentes",
            value: pendentes.length,
            icon: "⚠️",
          },
          {
            title: "Turmas com registro",
            value: turmasComOcorrencia.size,
            icon: "📌",
          },
        ];

    const recentes = [...ocorrenciasVisiveis]
      .sort((a, b) => dataParaOrdenacao(b.data) - dataParaOrdenacao(a.data))
      .slice(0, 5);

    const ocorrenciasPorTurma = Array.from(
      ocorrenciasVisiveis.reduce((mapa, ocorrencia) => {
        const turma = ocorrencia.turma || "Sem turma";
        mapa.set(turma, (mapa.get(turma) || 0) + 1);
        return mapa;
      }, new Map()),
      ([turma, total]) => ({ turma, total }),
    )
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      cards,
      isGestao,
      ocorrenciasPorTurma,
      recentes,
      totalVisivel: ocorrenciasVisiveis.length,
    };
  }, [cadastrosSupabase, ocorrencias, user]);

  if (!user || !dadosDashboard) {
    return <div className="loading-screen">Carregando sistema...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Header />

        <main className="dashboard-content">
          <section className="welcome-box">
            <div>
              <h1>Dashboard</h1>
              <p>
                Bem-vindo, <strong>{user.nome}</strong>. Perfil:{" "}
                {nomePerfil(user.role)}. Escola:{" "}
                <strong>{user.escolaNome || "Nao informada"}</strong>.
              </p>
            </div>

            <span className="dashboard-escopo">
              {dadosDashboard.isGestao
                ? "Visualizando todos os registros"
                : "Visualizando suas turmas"}
            </span>
          </section>

          <section className="cards-grid" aria-label="Resumo da dashboard">
            {dadosDashboard.cards.map((item) => (
              <StatsCard
                key={item.title}
                title={item.title}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2>Ocorrências recentes</h2>
                <span>{dadosDashboard.totalVisivel} no total</span>
              </div>

              {dadosDashboard.recentes.length === 0 ? (
                <p className="dashboard-vazio">
                  Nenhuma ocorrência registrada.
                </p>
              ) : (
                <div className="dashboard-lista">
                  {dadosDashboard.recentes.map((ocorrencia) => (
                    <div className="dashboard-lista-item" key={ocorrencia.id}>
                      <div>
                        <strong>
                          {(ocorrencia.alunos || []).join(", ") || "Sem aluno"}
                        </strong>
                        <span>
                          {ocorrencia.turma} • {ocorrencia.turno} •{" "}
                          {ocorrencia.professorNome}
                        </span>
                      </div>
                      <small>{ocorrencia.data}</small>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="dashboard-panel">
              <div className="dashboard-panel-header">
                <h2>Turmas com mais registros</h2>
                <span>Top 5</span>
              </div>

              {dadosDashboard.ocorrenciasPorTurma.length === 0 ? (
                <p className="dashboard-vazio">Nenhuma turma com ocorrência.</p>
              ) : (
                <div className="dashboard-ranking">
                  {dadosDashboard.ocorrenciasPorTurma.map((item) => (
                    <div className="ranking-item" key={item.turma}>
                      <div>
                        <strong>{item.turma}</strong>
                        <span>{item.total} ocorrência(s)</span>
                      </div>
                      <div className="ranking-barra">
                        <span
                          style={{
                            width: `${Math.max(
                              12,
                              (item.total /
                                dadosDashboard.ocorrenciasPorTurma[0].total) *
                                100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

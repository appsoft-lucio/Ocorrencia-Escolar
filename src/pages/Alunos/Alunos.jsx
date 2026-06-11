// =========================
// ESTILOS
// =========================
//import "./Alunos.css";

// =========================
// REACT
// =========================
import { useContext, useMemo, useState } from "react";

// =========================
// COMPONENTES
// =========================
import Sidebar from "../../components/Sidebar/sidebar";
import Header from "../../components/Header/Header";

// =========================
// CONTEXTOS
// =========================
import { AuthContext } from "../../context/AuthContext";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

function Alunos() {
  // =========================
  // CONTEXTOS
  // =========================
  const { user } = useContext(AuthContext);
  const { ocorrencias } = useContext(OcorrenciaContext);

  // =========================
  // FILTROS
  // =========================
  const [pesquisa, setPesquisa] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  // =========================
  // OCORRÊNCIAS VISÍVEIS
  // =========================
  const ocorrenciasVisiveis =
    user.role === "direcao"
      ? ocorrencias
      : ocorrencias.filter((item) => item.professorId === user.id);

  // =========================
  // LISTA DE ALUNOS
  // =========================
  const alunos = useMemo(() => {
    const mapa = {};

    ocorrenciasVisiveis.forEach((ocorrencia) => {
      ocorrencia.alunos.forEach((nome) => {
        if (!mapa[nome]) {
          mapa[nome] = {
            nome,
            turma: ocorrencia.turma,
            turno: ocorrencia.turno,
            professor: ocorrencia.professorNome,
            quantidade: 1,
            ultimaData: ocorrencia.data,
          };
        } else {
          mapa[nome].quantidade += 1;
        }
      });
    });

    return Object.values(mapa);
  }, [ocorrenciasVisiveis]);

  // =========================
  // FILTRAGEM
  // =========================
  const alunosFiltrados = alunos.filter((aluno) => {
    const nomeOk = aluno.nome.toLowerCase().includes(pesquisa.toLowerCase());

    const turmaOk = filtroTurma === "" || aluno.turma === filtroTurma;

    const turnoOk = filtroTurno === "" || aluno.turno === filtroTurno;

    return nomeOk && turmaOk && turnoOk;
  });

  // =========================
  // TURMAS
  // =========================
  const turmas = [...new Set(alunos.map((a) => a.turma))].sort();

  // =========================
  // IMPRIMIR
  // =========================
  function imprimirPagina() {
    window.print();
  }

  // =========================
  // JSX
  // =========================
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Header />

        <main className="alunos-container">
          {/* CABEÇALHO */}

          <div className="alunos-topo">
            <div>
              <h2>Alunos com Ocorrências</h2>

              <p>
                Total encontrados: <strong>{alunosFiltrados.length}</strong>
              </p>
            </div>

            <button className="btn-imprimir" onClick={imprimirPagina}>
              🖨️ Imprimir
            </button>
          </div>

          {/* FILTROS */}

          <div className="filtros">
            <input
              type="text"
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

            <select
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
            >
              <option value="">Todas as turmas</option>

              {turmas.map((turma) => (
                <option key={turma} value={turma}>
                  {turma}
                </option>
              ))}
            </select>

            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(e.target.value)}
            >
              <option value="">Todos os turnos</option>

              <option value="manha">Manhã</option>

              <option value="tarde">Tarde</option>

              <option value="noite">Noite</option>
            </select>
          </div>

          {/* CARDS */}

          <div className="alunos-grid">
            {alunosFiltrados.length === 0 && (
              <div className="sem-registros">Nenhum aluno encontrado.</div>
            )}

            {alunosFiltrados.map((aluno, index) => (
              <div className="card-aluno" key={index}>
                <div className="avatar">👨‍🎓</div>

                <h3>{aluno.nome}</h3>

                <p>
                  <strong>Turma:</strong> {aluno.turma}
                </p>

                <p>
                  <strong>Turno:</strong> {aluno.turno}
                </p>

                <p>
                  <strong>Professor:</strong> {aluno.professor}
                </p>

                <p>
                  <strong>Ocorrências:</strong> {aluno.quantidade}
                </p>

                <p>
                  <strong>Último registro:</strong>
                  <br />
                  {aluno.ultimaData}
                </p>

                <div className="acoes-card">
                  <button>👁️ Ver Histórico</button>

                  <button>📝 Nova Ocorrência</button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Alunos;

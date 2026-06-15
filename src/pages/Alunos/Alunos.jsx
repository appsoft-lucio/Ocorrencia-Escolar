import "./Alunos.css";

import { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

function Alunos() {
  const navigate = useNavigate();

  const { user } = useContext(AuthContext);
  const { ocorrencias } = useContext(OcorrenciaContext);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  /* =========================
     OCORRÊNCIAS VISÍVEIS
  ========================= */
  const ocorrenciasVisiveis = useMemo(() => {
    if (!user) return [];

    return user.role === "direcao"
      ? ocorrencias
      : ocorrencias.filter((item) => item.professorId === user.id);
  }, [ocorrencias, user]);

  /* =========================
     AGRUPA ALUNOS
  ========================= */
  const alunos = useMemo(() => {
    const mapa = new Map();

    ocorrenciasVisiveis.forEach((ocorrencia) => {
      ocorrencia.alunos.forEach((nome) => {
        const alunoAtual = mapa.get(nome);

        if (!alunoAtual) {
          mapa.set(nome, {
            nome,
            turma: ocorrencia.turma,
            turno: ocorrencia.turno,
            professor: ocorrencia.professorNome,
            quantidade: 1,
            ultimaData: ocorrencia.data,
            ocorrencias: [ocorrencia],
          });
          return;
        }

        mapa.set(nome, {
          ...alunoAtual,
          quantidade: alunoAtual.quantidade + 1,
          ultimaData: ocorrencia.data,
          ocorrencias: [...alunoAtual.ocorrencias, ocorrencia],
        });
      });
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [ocorrenciasVisiveis]);

  /* =========================
     FILTROS
  ========================= */
  const alunosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    return alunos.filter((aluno) => {
      const nomeOk = aluno.nome.toLowerCase().includes(termo);
      const turmaOk = !filtroTurma || aluno.turma === filtroTurma;
      const turnoOk = !filtroTurno || aluno.turno === filtroTurno;

      return nomeOk && turmaOk && turnoOk;
    });
  }, [alunos, pesquisa, filtroTurma, filtroTurno]);

  /* =========================
     LISTAS DE FILTRO
  ========================= */
  const turmas = useMemo(
    () => [...new Set(alunos.map((a) => a.turma))].filter(Boolean).sort(),
    [alunos],
  );

  const turnos = useMemo(
    () => [...new Set(alunos.map((a) => a.turno))].filter(Boolean).sort(),
    [alunos],
  );

  /* =========================
     DETALHES DO ALUNO
  ========================= */
  const detalhesAluno = useMemo(() => {
    if (!alunoSelecionado) return null;

    return alunos.find((a) => a.nome === alunoSelecionado) || null;
  }, [alunoSelecionado, alunos]);

  /* =========================
     AÇÕES
  ========================= */
  const imprimirPagina = useCallback(() => {
    window.print();
  }, []);

  const abrirHistorico = useCallback((nome) => {
    setAlunoSelecionado((atual) => (atual === nome ? null : nome));
  }, []);

  const abrirNovaOcorrencia = useCallback(() => {
    navigate("/ocorrencias");
  }, [navigate]);

  /* =========================
     LOADING USER
  ========================= */
  if (!user) {
    return <div className="alunos-feedback">Carregando usuário...</div>;
  }

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Header />

        <main className="alunos-container">
          {/* TOPO */}
          <section className="alunos-topo">
            <div>
              <h2>Alunos com Ocorrências</h2>
              <p>
                Total encontrados: <strong>{alunosFiltrados.length}</strong>
              </p>
            </div>

            <button className="btn-imprimir" onClick={imprimirPagina}>
              Imprimir
            </button>
          </section>

          {/* FILTROS */}
          <section className="filtros">
            <div className="campo">
              <label htmlFor="pesquisa-aluno">Pesquisar aluno</label>
              <input
                id="pesquisa-aluno"
                type="text"
                placeholder="Pesquisar aluno..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="filtro-turma">Turma</label>
              <select
                id="filtro-turma"
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
            </div>

            <div className="campo">
              <label htmlFor="filtro-turno">Turno</label>
              <select
                id="filtro-turno"
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
              >
                <option value="">Todos os turnos</option>
                {turnos.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* LISTA */}
          <section className="alunos-grid">
            {alunosFiltrados.length === 0 && (
              <div className="sem-registros">Nenhum aluno encontrado.</div>
            )}

            {alunosFiltrados.map((aluno) => (
              <article className="card-aluno" key={aluno.nome}>
                <div className="avatar">
                  {aluno.nome.charAt(0).toUpperCase()}
                </div>

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
                  <button onClick={() => abrirHistorico(aluno.nome)}>
                    Ver Histórico
                  </button>

                  <button onClick={abrirNovaOcorrencia}>Nova Ocorrência</button>
                </div>
              </article>
            ))}
          </section>

          {/* HISTÓRICO */}
          {detalhesAluno && (
            <section className="historico-aluno">
              <div className="historico-topo">
                <div>
                  <h3>Histórico de {detalhesAluno.nome}</h3>
                  <p>{detalhesAluno.quantidade} ocorrência(s) registrada(s)</p>
                </div>

                <button onClick={() => setAlunoSelecionado(null)}>
                  Fechar
                </button>
              </div>

              <div className="historico-lista">
                {detalhesAluno.ocorrencias.map((ocorrencia) => (
                  <article className="historico-item" key={ocorrencia.id}>
                    <strong>{ocorrencia.data}</strong>

                    <span>
                      {ocorrencia.disciplina} - {ocorrencia.turno} -{" "}
                      {ocorrencia.horario}º aula
                    </span>

                    <span>
                      {ocorrencia.tipos?.join(", ") || "Não informado"}
                    </span>

                    {ocorrencia.observacao && <p>{ocorrencia.observacao}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Alunos;

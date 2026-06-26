import "./Alunos.css";

import { useCallback, useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { AuthContext } from "../../context/AuthContext";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

const GESTAO_ROLES = ["diretor", "direcao", "vice_diretor", "coordenador", "coordenacao"];

function lerStorage(chave, fallback = []) {
  try {
    const valor = localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : fallback;
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

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function normalizarTurmasProfessor(turmas = []) {
  return turmas
    .map((turma) => {
      if (typeof turma === "string") return turma;
      return turma.codigo || turma.nome || "";
    })
    .filter(Boolean);
}

function dataParaOrdenacao(data) {
  if (!data) return 0;

  const dataDireta = new Date(data).getTime();
  if (!Number.isNaN(dataDireta)) return dataDireta;

  const [dataParte] = data.split(",");
  const partes = dataParte.trim().split(/[/-]/);
  if (partes.length !== 3) return 0;

  const [dia, mes, ano] = partes;
  return new Date(`${ano}-${mes}-${dia}`).getTime() || 0;
}

function Alunos() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { ocorrencias } = useContext(OcorrenciaContext);

  const [pesquisa, setPesquisa] = useState("");
  const [filtroTurma, setFiltroTurma] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");
  const [filtroProfessor, setFiltroProfessor] = useState("");
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const isGestao = GESTAO_ROLES.includes(user?.role);

  const ocorrenciasVisiveis = useMemo(() => {
    if (!user) return [];
    if (isGestao) return ocorrencias;

    const professores = lerStorage(criarChaveEscola("professores", user.escolaId));
    const professorAtual = professores.find(
      (professor) =>
        professor.id === user.id ||
        normalizarTexto(professor.nome) === normalizarTexto(user.nome),
    );
    const turmasDoProfessor = new Set(
      normalizarTurmasProfessor(professorAtual?.turmas),
    );

    return ocorrencias.filter(
      (item) =>
        item.professorId === user.id ||
        normalizarTexto(item.professorNome) === normalizarTexto(user.nome) ||
        turmasDoProfessor.has(item.turma),
    );
  }, [isGestao, ocorrencias, user]);

  const alunos = useMemo(() => {
    const mapa = new Map();

    ocorrenciasVisiveis.forEach((ocorrencia) => {
      (ocorrencia.alunos || []).forEach((nome) => {
        const alunoAtual = mapa.get(nome);
        const dataAtual = dataParaOrdenacao(ocorrencia.data);
        const ultimaDataAtual = dataParaOrdenacao(alunoAtual?.ultimaData);

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
          turma: dataAtual >= ultimaDataAtual ? ocorrencia.turma : alunoAtual.turma,
          turno: dataAtual >= ultimaDataAtual ? ocorrencia.turno : alunoAtual.turno,
          professor:
            dataAtual >= ultimaDataAtual
              ? ocorrencia.professorNome
              : alunoAtual.professor,
          ultimaData:
            dataAtual >= ultimaDataAtual ? ocorrencia.data : alunoAtual.ultimaData,
          ocorrencias: [...alunoAtual.ocorrencias, ocorrencia].sort(
            (a, b) => dataParaOrdenacao(b.data) - dataParaOrdenacao(a.data),
          ),
        });
      });
    });

    return Array.from(mapa.values()).sort((a, b) => {
      if (b.quantidade !== a.quantidade) return b.quantidade - a.quantidade;
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [ocorrenciasVisiveis]);

  const turmas = useMemo(
    () => [...new Set(alunos.map((aluno) => aluno.turma))].filter(Boolean).sort(),
    [alunos],
  );

  const turnos = useMemo(
    () => [...new Set(alunos.map((aluno) => aluno.turno))].filter(Boolean).sort(),
    [alunos],
  );

  const professores = useMemo(
    () =>
      [...new Set(alunos.map((aluno) => aluno.professor))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR")),
    [alunos],
  );

  const alunosFiltrados = useMemo(() => {
    const termo = normalizarTexto(pesquisa);

    return alunos.filter((aluno) => {
      const nomeOk = !termo || normalizarTexto(aluno.nome).includes(termo);
      const turmaOk = !filtroTurma || aluno.turma === filtroTurma;
      const turnoOk = !filtroTurno || aluno.turno === filtroTurno;
      const professorOk = !filtroProfessor || aluno.professor === filtroProfessor;

      return nomeOk && turmaOk && turnoOk && professorOk;
    });
  }, [alunos, filtroProfessor, filtroTurma, filtroTurno, pesquisa]);

  const resumo = useMemo(() => {
    const recorrentes = alunos.filter((aluno) => aluno.quantidade >= 3).length;
    const turmasComRegistro = new Set(alunos.map((aluno) => aluno.turma).filter(Boolean));

    return {
      alunos: alunos.length,
      ocorrencias: ocorrenciasVisiveis.length,
      recorrentes,
      turmas: turmasComRegistro.size,
    };
  }, [alunos, ocorrenciasVisiveis]);

  const detalhesAluno = useMemo(() => {
    if (!alunoSelecionado) return null;
    return alunos.find((aluno) => aluno.nome === alunoSelecionado) || null;
  }, [alunoSelecionado, alunos]);

  const imprimirPagina = useCallback(() => {
    window.print();
  }, []);

  const abrirHistorico = useCallback((nome) => {
    setAlunoSelecionado((atual) => (atual === nome ? null : nome));
  }, []);

  const abrirNovaOcorrencia = useCallback(() => {
    navigate("/ocorrencias");
  }, [navigate]);

  const abrirRelatorios = useCallback(() => {
    navigate("/relatorios");
  }, [navigate]);

  const limparFiltros = useCallback(() => {
    setPesquisa("");
    setFiltroTurma("");
    setFiltroTurno("");
    setFiltroProfessor("");
  }, []);

  if (!user) {
    return <div className="alunos-feedback">Carregando usuário...</div>;
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-main">
        <Header />

        <main className="alunos-container">
          <section className="alunos-topo">
            <div>
              <h1>Alunos</h1>
              <p>
                {isGestao
                  ? "Consulta geral dos alunos com ocorrências registradas."
                  : "Consulta dos alunos vinculados às suas ocorrências e turmas."}
              </p>
            </div>

            <div className="alunos-acoes-topo">
              {isGestao && (
                <button type="button" className="btn-secundario" onClick={abrirRelatorios}>
                  Relatórios
                </button>
              )}
              <button type="button" className="btn-secundario" onClick={imprimirPagina}>
                Imprimir
              </button>
              <button type="button" className="btn-primario" onClick={abrirNovaOcorrencia}>
                Nova ocorrência
              </button>
            </div>
          </section>

          <section className="alunos-resumo" aria-label="Resumo dos alunos">
            <div>
              <strong>{resumo.alunos}</strong>
              <span>Alunos</span>
            </div>
            <div>
              <strong>{resumo.ocorrencias}</strong>
              <span>Ocorrências</span>
            </div>
            <div>
              <strong>{resumo.recorrentes}</strong>
              <span>Recorrentes</span>
            </div>
            <div>
              <strong>{resumo.turmas}</strong>
              <span>Turmas</span>
            </div>
          </section>

          <section className="filtros">
            <div className="campo campo-pesquisa">
              <label htmlFor="pesquisa-aluno">Pesquisar aluno</label>
              <input
                id="pesquisa-aluno"
                type="search"
                placeholder="Digite o nome do aluno"
                value={pesquisa}
                onChange={(event) => setPesquisa(event.target.value)}
              />
            </div>

            <div className="campo">
              <label htmlFor="filtro-turma">Turma</label>
              <select
                id="filtro-turma"
                value={filtroTurma}
                onChange={(event) => setFiltroTurma(event.target.value)}
              >
                <option value="">Todas</option>
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
                onChange={(event) => setFiltroTurno(event.target.value)}
              >
                <option value="">Todos</option>
                {turnos.map((turno) => (
                  <option key={turno} value={turno}>
                    {turno}
                  </option>
                ))}
              </select>
            </div>

            {isGestao && (
              <div className="campo">
                <label htmlFor="filtro-professor">Professor</label>
                <select
                  id="filtro-professor"
                  value={filtroProfessor}
                  onChange={(event) => setFiltroProfessor(event.target.value)}
                >
                  <option value="">Todos</option>
                  {professores.map((professor) => (
                    <option key={professor} value={professor}>
                      {professor}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button type="button" className="btn-limpar" onClick={limparFiltros}>
              Limpar
            </button>
          </section>

          <section className="alunos-grid">
            {alunosFiltrados.length === 0 && (
              <div className="sem-registros">Nenhum aluno encontrado.</div>
            )}

            {alunosFiltrados.map((aluno) => (
              <article className="card-aluno" key={aluno.nome}>
                <div className="card-aluno-topo">
                  <div className="avatar">{aluno.nome.charAt(0).toUpperCase()}</div>
                  {aluno.quantidade >= 3 && <span>Recorrente</span>}
                </div>

                <h3>{aluno.nome}</h3>

                <dl>
                  <div>
                    <dt>Turma</dt>
                    <dd>{aluno.turma || "-"}</dd>
                  </div>
                  <div>
                    <dt>Turno</dt>
                    <dd>{aluno.turno || "-"}</dd>
                  </div>
                  <div>
                    <dt>Professor</dt>
                    <dd>{aluno.professor || "-"}</dd>
                  </div>
                  <div>
                    <dt>Ocorrências</dt>
                    <dd>{aluno.quantidade}</dd>
                  </div>
                </dl>

                <p className="ultimo-registro">
                  <strong>Último registro:</strong> {aluno.ultimaData || "-"}
                </p>

                <div className="acoes-card">
                  <button type="button" onClick={() => abrirHistorico(aluno.nome)}>
                    Ver histórico
                  </button>
                  <button type="button" onClick={abrirNovaOcorrencia}>
                    Nova ocorrência
                  </button>
                </div>
              </article>
            ))}
          </section>

          {detalhesAluno && (
            <section className="historico-aluno">
              <div className="historico-topo">
                <div>
                  <h2>Histórico de {detalhesAluno.nome}</h2>
                  <p>{detalhesAluno.quantidade} ocorrência(s) registrada(s)</p>
                </div>

                <button type="button" onClick={() => setAlunoSelecionado(null)}>
                  Fechar
                </button>
              </div>

              <div className="historico-lista">
                {detalhesAluno.ocorrencias.map((ocorrencia) => (
                  <article className="historico-item" key={ocorrencia.id}>
                    <div>
                      <strong>{ocorrencia.data}</strong>
                      <span>
                        {ocorrencia.disciplina} • {ocorrencia.turno} •{" "}
                        {ocorrencia.horario ? `${ocorrencia.horario}º aula` : "Horário não informado"}
                      </span>
                    </div>

                    <p>
                      <strong>Tipo:</strong>{" "}
                      {ocorrencia.tipos?.join(", ") || "Não informado"}
                    </p>

                    <p>
                      <strong>Professor:</strong> {ocorrencia.professorNome || "-"}
                    </p>

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

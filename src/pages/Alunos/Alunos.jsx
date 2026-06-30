import "./Alunos.css";

import { useCallback, useContext, useMemo, useState } from "react";
import html2pdf from "html2pdf.js";
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

function contarOcorrenciasPor(lista, getValores) {
  const mapa = new Map();

  lista.forEach((item) => {
    const valores = getValores(item);
    const listaValores = Array.isArray(valores) ? valores : [valores];

    listaValores.filter(Boolean).forEach((valor) => {
      mapa.set(valor, (mapa.get(valor) || 0) + 1);
    });
  });

  return Array.from(mapa, ([nome, total]) => ({ nome, total })).sort(
    (a, b) => b.total - a.total || a.nome.localeCompare(b.nome, "pt-BR"),
  );
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
  const [mostrarPreviaRelatorio, setMostrarPreviaRelatorio] = useState(false);
  const [analisePedagogica, setAnalisePedagogica] = useState("");
  const [medidasPropostas, setMedidasPropostas] = useState("");
  const [responsavelPedagogico, setResponsavelPedagogico] = useState("");
  const [responsavelDirecao, setResponsavelDirecao] = useState("");

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

  const analiseFiltrada = useMemo(() => {
    const nomesFiltrados = new Set(alunosFiltrados.map((aluno) => aluno.nome));
    const ocorrenciasFiltradas = ocorrenciasVisiveis.filter((ocorrencia) =>
      (ocorrencia.alunos || []).some((nome) => nomesFiltrados.has(nome)),
    );

    return {
      alunosRecorrentes: alunosFiltrados.filter((aluno) => aluno.quantidade >= 3),
      ocorrenciasFiltradas,
      porTipo: contarOcorrenciasPor(
        ocorrenciasFiltradas,
        (ocorrencia) => ocorrencia.tipos || [],
      ),
      porTurma: contarOcorrenciasPor(
        ocorrenciasFiltradas,
        (ocorrencia) => ocorrencia.turma,
      ),
      porTurno: contarOcorrenciasPor(
        ocorrenciasFiltradas,
        (ocorrencia) => ocorrencia.turno,
      ),
    };
  }, [alunosFiltrados, ocorrenciasVisiveis]);

  const detalhesAluno = useMemo(() => {
    if (!alunoSelecionado) return null;
    return alunos.find((aluno) => aluno.nome === alunoSelecionado) || null;
  }, [alunoSelecionado, alunos]);

  const gerarPDF = useCallback((elementId, filename) => {
    const elemento = document.getElementById(elementId);

    if (!elemento) return;

    html2pdf()
      .set({
        margin: 0.45,
        filename,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .from(elemento)
      .save();
  }, []);

  const gerarPDFGrupo = useCallback(() => {
    gerarPDF("relatorio-alunos-pdf", "relatorio-pedagogico-alunos.pdf");
  }, [gerarPDF]);

  const imprimirRelatorio = useCallback(() => {
    const elemento = document.getElementById("relatorio-alunos-pdf");
    if (!elemento) return;

    const janela = window.open("", "_blank", "width=900,height=700");
    if (!janela) return;

    janela.document.write(`
      <html>
        <head>
          <title>Relatorio pedagogico</title>
          <style>
            body { margin: 24px; font-family: Arial, sans-serif; color: #111827; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 7px; border: 1px solid #d9dee7; text-align: left; vertical-align: top; }
            th { background: #f3f4f6; }
            h1 { font-size: 22px; margin-bottom: 6px; }
            h2 { font-size: 15px; margin: 0 0 8px; }
            section { margin-bottom: 14px; }
            .relatorio-pdf-resumo, .relatorio-pdf-grid, .relatorio-assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .relatorio-pdf-resumo { grid-template-columns: repeat(4, 1fr); }
            .relatorio-pdf-resumo div, .relatorio-pdf-bloco, .relatorio-pdf-grid > div { padding: 10px; border: 1px solid #d9dee7; border-radius: 6px; }
            .relatorio-assinaturas { margin-top: 38px; gap: 28px; }
            .relatorio-assinaturas span { padding-top: 8px; border-top: 1px solid #111827; text-align: center; }
          </style>
        </head>
        <body>${elemento.innerHTML}</body>
      </html>
    `);
    janela.document.close();
    janela.focus();
    janela.print();
  }, []);

  const gerarPDFAluno = useCallback(() => {
    if (!detalhesAluno) return;

    const nomeArquivo = detalhesAluno.nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    gerarPDF("relatorio-aluno-individual-pdf", `relatorio-${nomeArquivo}.pdf`);
  }, [detalhesAluno, gerarPDF]);

  const abrirHistorico = useCallback((nome) => {
    setAlunoSelecionado((atual) => (atual === nome ? null : nome));
  }, []);

  const abrirNovaOcorrencia = useCallback(() => {
    navigate("/ocorrencias");
  }, [navigate]);

  const abrirRelatorios = useCallback(() => {
    setMostrarPreviaRelatorio(true);
    window.requestAnimationFrame(() => {
      document
        .getElementById("previa-relatorio-alunos")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

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
              <button type="button" className="btn-secundario" onClick={abrirRelatorios}>
                Relatórios
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
                <button type="button" onClick={gerarPDFAluno}>
                  PDF do aluno
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

          {mostrarPreviaRelatorio && (
            <section
              id="previa-relatorio-alunos"
              className="relatorio-preview-container"
            >
              <div className="relatorio-preview-topo">
                <div>
                  <h2>Prévia do relatório pedagógico</h2>
                  <p>Revise os dados filtrados antes de imprimir, salvar ou compartilhar.</p>
                </div>

                <div className="relatorio-preview-acoes">
                  <button type="button" onClick={imprimirRelatorio}>
                    Imprimir
                  </button>
                  <button type="button" onClick={gerarPDFGrupo}>
                    Salvar PDF
                  </button>
                  <button
                    type="button"
                    className="btn-fechar-preview"
                    onClick={() => setMostrarPreviaRelatorio(false)}
                  >
                    Fechar
                  </button>
                </div>
              </div>

              <div className="relatorio-preview-campos">
                <label>
                  Análise pedagógica
                  <textarea
                    value={analisePedagogica}
                    onChange={(event) => setAnalisePedagogica(event.target.value)}
                    placeholder="Descreva a leitura pedagógica do grupo filtrado."
                  />
                </label>

                <label>
                  Medidas propostas
                  <textarea
                    value={medidasPropostas}
                    onChange={(event) => setMedidasPropostas(event.target.value)}
                    placeholder="Registre combinados, contatos com responsáveis e encaminhamentos."
                  />
                </label>

                <div className="relatorio-preview-assinantes">
                  <label>
                    Responsável pedagógico
                    <input
                      value={responsavelPedagogico}
                      onChange={(event) =>
                        setResponsavelPedagogico(event.target.value)
                      }
                      placeholder="Nome para assinatura"
                    />
                  </label>

                  <label>
                    Direção/coordenação
                    <input
                      value={responsavelDirecao}
                      onChange={(event) => setResponsavelDirecao(event.target.value)}
                      placeholder="Nome para assinatura"
                    />
                  </label>
                </div>
              </div>
            </section>
          )}

          <section
            id="relatorio-alunos-pdf"
            className={`relatorio-pdf ${
              mostrarPreviaRelatorio ? "relatorio-pdf-preview" : "oculto-pdf"
            }`}
          >
            <header className="relatorio-pdf-cabecalho">
              <h1>Relatório pedagógico de alunos</h1>
              <p>{user?.escolaNome || "EduRegistro"}</p>
              <span>Emitido em {new Date().toLocaleDateString("pt-BR")}</span>
            </header>

            <section className="relatorio-pdf-resumo">
              <div>
                <strong>{alunosFiltrados.length}</strong>
                <span>Alunos filtrados</span>
              </div>
              <div>
                <strong>{analiseFiltrada.ocorrenciasFiltradas.length}</strong>
                <span>Ocorrências</span>
              </div>
              <div>
                <strong>{analiseFiltrada.alunosRecorrentes.length}</strong>
                <span>Recorrentes</span>
              </div>
              <div>
                <strong>{analiseFiltrada.porTurma.length}</strong>
                <span>Turmas</span>
              </div>
            </section>

            <section className="relatorio-pdf-bloco">
              <h2>Filtros considerados</h2>
              <p>
                Aluno: {pesquisa || "Todos"} | Turma: {filtroTurma || "Todas"} |
                Turno: {filtroTurno || "Todos"} | Professor:{" "}
                {filtroProfessor || "Todos"}
              </p>
            </section>

            <section className="relatorio-pdf-grid">
              <div>
                <h2>Mais recorrentes</h2>
                {alunosFiltrados.slice(0, 10).map((aluno, index) => (
                  <p key={aluno.nome}>
                    {index + 1}. {aluno.nome} - {aluno.quantidade} ocorrência(s)
                  </p>
                ))}
              </div>
              <div>
                <h2>Por tipo</h2>
                {analiseFiltrada.porTipo.slice(0, 8).map((item) => (
                  <p key={item.nome}>
                    {item.nome}: {item.total}
                  </p>
                ))}
              </div>
              <div>
                <h2>Por turma</h2>
                {analiseFiltrada.porTurma.slice(0, 8).map((item) => (
                  <p key={item.nome}>
                    {item.nome}: {item.total}
                  </p>
                ))}
              </div>
              <div>
                <h2>Por turno</h2>
                {analiseFiltrada.porTurno.slice(0, 8).map((item) => (
                  <p key={item.nome}>
                    {item.nome}: {item.total}
                  </p>
                ))}
              </div>
            </section>

            <section className="relatorio-pdf-bloco">
              <h2>Quadro comparativo de alunos</h2>
              <table>
                <thead>
                  <tr>
                    <th>Aluno</th>
                    <th>Turma</th>
                    <th>Turno</th>
                    <th>Ocorrências</th>
                    <th>Último registro</th>
                  </tr>
                </thead>
                <tbody>
                  {alunosFiltrados.map((aluno) => (
                    <tr key={aluno.nome}>
                      <td>{aluno.nome}</td>
                      <td>{aluno.turma || "-"}</td>
                      <td>{aluno.turno || "-"}</td>
                      <td>{aluno.quantidade}</td>
                      <td>{aluno.ultimaData || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="relatorio-pdf-bloco">
              <h2>Encaminhamento pedagógico</h2>
              <p>
                <strong>Análise:</strong>{" "}
                {analisePedagogica ||
                  "Campo reservado para registrar comparação entre alunos e padrões por turma, turno e tipo de ocorrência."}
              </p>
              <p>
                <strong>Medidas propostas:</strong>{" "}
                {medidasPropostas ||
                  "Campo reservado para registrar medidas propostas pela equipe pedagógica."}
              </p>
              <div className="relatorio-assinaturas">
                <span>{responsavelPedagogico || "Responsável pedagógico"}</span>
                <span>{responsavelDirecao || "Direção/coordenação"}</span>
              </div>
            </section>
          </section>

          {detalhesAluno && (
            <section
              id="relatorio-aluno-individual-pdf"
              className="relatorio-pdf oculto-pdf"
            >
              <header className="relatorio-pdf-cabecalho">
                <h1>Relatório individual do aluno</h1>
                <p>{user?.escolaNome || "EduRegistro"}</p>
                <span>Emitido em {new Date().toLocaleDateString("pt-BR")}</span>
              </header>

              <section className="relatorio-pdf-bloco">
                <h2>{detalhesAluno.nome}</h2>
                <p>
                  Turma: {detalhesAluno.turma || "-"} | Turno:{" "}
                  {detalhesAluno.turno || "-"} | Professor:{" "}
                  {detalhesAluno.professor || "-"}
                </p>
                <p>Total de ocorrências: {detalhesAluno.quantidade}</p>
              </section>

              <section className="relatorio-pdf-bloco">
                <h2>Histórico detalhado</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Disciplina</th>
                      <th>Tipo</th>
                      <th>Professor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalhesAluno.ocorrencias.map((ocorrencia) => (
                      <tr key={ocorrencia.id}>
                        <td>{ocorrencia.data}</td>
                        <td>{ocorrencia.disciplina || "-"}</td>
                        <td>{ocorrencia.tipos?.join(", ") || "-"}</td>
                        <td>{ocorrencia.professorNome || "-"}</td>
                        <td>{ocorrencia.status || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="relatorio-pdf-bloco">
                <h2>Síntese pedagógica</h2>
                <p>
                  Campo reservado para observações da coordenação, contato com
                  responsáveis, combinados e encaminhamentos.
                </p>
                <div className="relatorio-assinaturas">
                  <span>Responsável escolar</span>
                  <span>Responsável pelo aluno</span>
                </div>
              </section>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default Alunos;



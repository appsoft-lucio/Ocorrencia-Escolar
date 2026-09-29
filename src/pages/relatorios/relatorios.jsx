import { dataOcorrenciaParaISO, diaSemanaOcorrencia, rotuloHorario, maiorFrequencia } from "../../utils/relatorios";
import "./relatorios.css";

import { useContext, useMemo, useState } from "react";
import { criarRelatorioPdf } from "../../utils/relatorioPdf";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import GraficoBarrasHorizontais from "../../components/graficos/GraficoBarrasHorizontais.jsx";
import GraficoProfessores from "../../components/graficos/graficoProfessor.jsx";
import GraficoTurmas from "../../components/graficos/graficoTurmas.jsx";
import GraficoTurnos from "../../components/graficos/graficoTurno.jsx";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

const FILTROS_INICIAIS = {
  alunos: [],
  dias: [],
  horarios: [],
  dataFim: "",
  dataInicio: "",
  professores: [],
  tipos: [],
  turmas: [],
  turnos: [],
};

function ordenarTexto(lista) {
  return [...lista].filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function contarPor(lista, getChave) {
  const mapa = new Map();

  lista.forEach((item) => {
    const chave = getChave(item);
    if (!chave) return;
    mapa.set(chave, (mapa.get(chave) || 0) + 1);
  });

  return Array.from(mapa, ([nome, ocorrencias]) => ({ nome, ocorrencias })).sort(
    (a, b) => b.ocorrencias - a.ocorrencias,
  );
}

function MultiFiltro({ titulo, opcoes, selecionados, onToggle }) {
  return (
    <fieldset className="filtro-bloco">
      <legend>{titulo}</legend>

      {opcoes.length === 0 ? (
        <p>Nenhum item disponível.</p>
      ) : (
        <div className="filtro-opcoes">
          {opcoes.map((opcao) => (
            <label key={opcao}>
              <input
                type="checkbox"
                checked={selecionados.includes(opcao)}
                onChange={() => onToggle(opcao)}
              />
              <span>{opcao}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

function GraficoSimples({ dados, dataKey }) {
  return <GraficoBarrasHorizontais dados={dados} dataKey={dataKey} />;
}

export default function Relatorios() {
  const { ocorrencias } = useContext(OcorrenciaContext);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [incluirRegistros, setIncluirRegistros] = useState(false);

  const listas = useMemo(
    () => ({
      dias: ordenarTexto(new Set(ocorrencias.map((item) => diaSemanaOcorrencia(item.data)))),
      horarios: ordenarTexto(new Set(ocorrencias.map((item) => rotuloHorario(item.horario, item.turno)))),
      alunos: ordenarTexto(new Set(ocorrencias.flatMap((item) => item.alunos || []))),
      professores: ordenarTexto(
        new Set(ocorrencias.map((item) => item.professorNome)),
      ),
      tipos: ordenarTexto(new Set(ocorrencias.flatMap((item) => item.tipos || []))),
      turmas: ordenarTexto(new Set(ocorrencias.map((item) => item.turma))),
      turnos: ordenarTexto(new Set(ocorrencias.map((item) => item.turno))),
    }),
    [ocorrencias],
  );

  const alternarFiltro = (campo, valor) => {
    setFiltros((atuais) => ({
      ...atuais,
      [campo]: atuais[campo].includes(valor)
        ? atuais[campo].filter((item) => item !== valor)
        : [...atuais[campo], valor],
    }));
  };

  const atualizarData = (campo, valor) => {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
  };

  const limparFiltros = () => {
    setFiltros(FILTROS_INICIAIS);
  };

  const dadosFiltrados = useMemo(
    () =>
      ocorrencias.filter((item) => {
        const dataISO = dataOcorrenciaParaISO(item.data);
        const turmaOk =
          filtros.turmas.length === 0 || filtros.turmas.includes(item.turma);
        const turnoOk =
          filtros.turnos.length === 0 || filtros.turnos.includes(item.turno);
        const professorOk =
          filtros.professores.length === 0 ||
          filtros.professores.includes(item.professorNome);
        const alunoOk =
          filtros.alunos.length === 0 ||
          (item.alunos || []).some((aluno) => filtros.alunos.includes(aluno));
        const tipoOk =
          filtros.tipos.length === 0 ||
          (item.tipos || []).some((tipo) => filtros.tipos.includes(tipo));
        const dataInicioOk = !filtros.dataInicio || dataISO >= filtros.dataInicio;
        const dataFimOk = !filtros.dataFim || dataISO <= filtros.dataFim;

        return (
          (filtros.dias.length === 0 || filtros.dias.includes(diaSemanaOcorrencia(item.data))) &&
          (filtros.horarios.length === 0 || filtros.horarios.includes(rotuloHorario(item.horario, item.turno))) &&
          turmaOk &&
          turnoOk &&
          professorOk &&
          alunoOk &&
          tipoOk &&
          dataInicioOk &&
          dataFimOk
        );
      }),
    [filtros, ocorrencias],
  );

  const resumo = useMemo(() => {
    const alunos = new Set(dadosFiltrados.flatMap((item) => item.alunos || []));
    const professores = new Set(dadosFiltrados.map((item) => item.professorNome));
    const turmas = new Set(dadosFiltrados.map((item) => item.turma));
    const tipos = new Set(dadosFiltrados.flatMap((item) => item.tipos || []));

    return {
      alunos: alunos.size,
      ocorrencias: dadosFiltrados.length,
      professores: professores.size,
      tipos: tipos.size,
      turmas: turmas.size,
    };
  }, [dadosFiltrados]);

  const dadosTurmas = useMemo(
    () =>
      contarPor(dadosFiltrados, (item) => item.turma).map((item) => ({
        turma: item.nome,
        ocorrencias: item.ocorrencias,
      })),
    [dadosFiltrados],
  );

  const dadosTurnos = useMemo(
    () =>
      contarPor(dadosFiltrados, (item) => item.turno).map((item) => ({
        turno: item.nome,
        ocorrencias: item.ocorrencias,
      })),
    [dadosFiltrados],
  );

  const dadosProfessores = useMemo(
    () =>
      contarPor(dadosFiltrados, (item) => item.professorNome).map((item) => ({
        professor: item.nome,
        ocorrencias: item.ocorrencias,
      })),
    [dadosFiltrados],
  );

  const dadosAlunos = useMemo(
    () =>
      contarPor(
        dadosFiltrados.flatMap((item) =>
          (item.alunos || []).map((aluno) => ({ aluno })),
        ),
        (item) => item.aluno,
      )
        .slice(0, 10)
        .map((item) => ({ aluno: item.nome, ocorrencias: item.ocorrencias })),
    [dadosFiltrados],
  );

  const dadosTipos = useMemo(
    () =>
      contarPor(
        dadosFiltrados.flatMap((item) =>
          (item.tipos || []).map((tipo) => ({ tipo })),
        ),
        (item) => item.tipo,
      ).map((item) => ({ tipo: item.nome, ocorrencias: item.ocorrencias })),
    [dadosFiltrados],
  );

  const dadosDias = useMemo(() => contarPor(dadosFiltrados, (item) => diaSemanaOcorrencia(item.data)), [dadosFiltrados]);
  const dadosHorarios = useMemo(() => contarPor(dadosFiltrados, (item) => rotuloHorario(item.horario, item.turno)), [dadosFiltrados]);
  const destaques = [
    ["Aluno com mais registros", maiorFrequencia(dadosAlunos, "aluno")],
    ["Horário com mais registros", maiorFrequencia(dadosHorarios, "nome")],
    ["Dia com mais registros", maiorFrequencia(dadosDias, "nome")],
    ["Turma com mais registros", maiorFrequencia(dadosTurmas, "turma")],
    ["Turno com mais registros", maiorFrequencia(dadosTurnos, "turno")],
    ["Professor com mais registros", maiorFrequencia(dadosProfessores, "professor")],
    ["Tipo mais frequente", maiorFrequencia(dadosTipos, "tipo")],
  ];

  const gerarPDF = () => {
    criarRelatorioPdf({
      resumo,
      destaques,
      filtros,
      demonstracao: dadosFiltrados.some((item) => item.observacao?.includes("[DEMONSTRACAO ESCOLA TESTE")),
      registros: incluirRegistros ? dadosFiltrados : [],
      graficos: [
        { titulo: "Por dia da semana", dados: dadosDias, chave: "nome" },
        { titulo: "Por hor\u00e1rio e turno", dados: dadosHorarios, chave: "nome" },
        { titulo: "Por turma", dados: dadosTurmas, chave: "turma" },
        { titulo: "Por turno", dados: dadosTurnos, chave: "turno" },
        { titulo: "Por professor que registrou", dados: dadosProfessores, chave: "professor" },
        { titulo: "Por aluno", dados: dadosAlunos, chave: "aluno" },
        { titulo: "Por tipo de ocorr\u00eancia", dados: dadosTipos, chave: "tipo" },
      ],
    }).save("relatorio-escolar.pdf");
  };

  const imprimir = () => window.print();

  return (
    <div className="relatorios-layout">
      <Sidebar />

      <div className="relatorios-main">
        <Header />

        <main className="relatorios-main-content">
          <section className="relatorios-topo">
            <div>
              <h1>Relatórios</h1>
              <p>Filtre os registros salvos e gere análise em texto e gráficos.</p>
            </div>

            <div className="relatorios-actions">
              <button type="button" onClick={limparFiltros}>
                Limpar filtros
              </button>
              <button type="button" aria-pressed={incluirRegistros} onClick={() => setIncluirRegistros((atual) => !atual)}>
                {incluirRegistros ? "Ocultar registros detalhados" : "Incluir registros detalhados"}
              </button>
              <button type="button" onClick={gerarPDF}>
                Exportar PDF
              </button>
              <button type="button" onClick={imprimir}>
                Imprimir
              </button>
            </div>
          </section>

          <section className="relatorios-filtros">
            <div className="filtro-periodo">
              <label>
                Data inicial
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(event) => atualizarData("dataInicio", event.target.value)}
                />
              </label>

              <label>
                Data final
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(event) => atualizarData("dataFim", event.target.value)}
                />
              </label>
            </div>

            <MultiFiltro
              titulo="Turnos"
              opcoes={listas.turnos}
              selecionados={filtros.turnos}
              onToggle={(valor) => alternarFiltro("turnos", valor)}
            />

            <MultiFiltro
              titulo="Turmas"
              opcoes={listas.turmas}
              selecionados={filtros.turmas}
              onToggle={(valor) => alternarFiltro("turmas", valor)}
            />

            <MultiFiltro
              titulo="Responsáveis pela ocorrência"
              opcoes={listas.professores}
              selecionados={filtros.professores}
              onToggle={(valor) => alternarFiltro("professores", valor)}
            />

            <MultiFiltro
              titulo="Alunos"
              opcoes={listas.alunos}
              selecionados={filtros.alunos}
              onToggle={(valor) => alternarFiltro("alunos", valor)}
            />

            <MultiFiltro
              titulo="Ocorrências"
              opcoes={listas.tipos}
              selecionados={filtros.tipos}
              onToggle={(valor) => alternarFiltro("tipos", valor)}
            />
            <MultiFiltro titulo="Dia da semana" opcoes={listas.dias} selecionados={filtros.dias} onToggle={(valor) => alternarFiltro("dias", valor)} />
            <MultiFiltro titulo="Horário e turno" opcoes={listas.horarios} selecionados={filtros.horarios} onToggle={(valor) => alternarFiltro("horarios", valor)} />
          </section>

          <div id="relatorio-pdf">
            <section className="print-header">
              <h1>Relatório escolar</h1>
              <p>Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
            </section>

            {dadosFiltrados.some((item) => item.observacao?.includes("[DEMONSTRACAO ESCOLA TESTE")) && (
              <p className="relatorio-demo">Demonstração com dados fictícios da escola Teste.</p>
            )}
            <section className="relatorios-cards">
              <div className="relatorio-card">
                <h3>Ocorrências</h3>
                <span>{resumo.ocorrencias}</span>
              </div>
              <div className="relatorio-card">
                <h3>Alunos</h3>
                <span>{resumo.alunos}</span>
              </div>
              <div className="relatorio-card">
                <h3>Turmas</h3>
                <span>{resumo.turmas}</span>
              </div>
              <div className="relatorio-card">
                <h3>Responsáveis</h3>
                <span>{resumo.professores}</span>
              </div>
              <div className="relatorio-card">
                <h3>Tipos</h3>
                <span>{resumo.tipos}</span>
              </div>
            </section>

            <section className="relatorio-texto">
              <h2>Resumo em texto</h2>
              {dadosFiltrados.length === 0 ? (
                <p>Nenhum registro encontrado para os filtros selecionados.</p>
              ) : (
                <p>
                  Foram encontradas <strong>{resumo.ocorrencias}</strong>{" "}
                  ocorrência(s), envolvendo <strong>{resumo.alunos}</strong>{" "}
                  aluno(s), <strong>{resumo.turmas}</strong> turma(s) e{" "}
                  <strong>{resumo.professores}</strong> responsável(is) pela ocorrência.
                </p>
              )}
            </section>

            <section className="relatorio-texto">
              <h2>Maiores frequências no período</h2>
              <p>Quantidades de registros nos filtros selecionados. O professor indicado é quem registrou as ocorrências.</p>
              <dl className="relatorio-destaques">
                {destaques.map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor}</dd></div>)}
              </dl>
            </section>
            <section className="relatorios-graficos">
              <div className="grafico-box">
                <h3>Por dia da semana</h3>
                <GraficoSimples dados={dadosDias} dataKey="nome" />
              </div>
              <div className="grafico-box">
                <h3>Por horário e turno</h3>
                <GraficoSimples dados={dadosHorarios} dataKey="nome" />
              </div>
              <div className="grafico-box">
                <h3>Por turma</h3>
                <GraficoTurmas dados={dadosTurmas} />
              </div>

              <div className="grafico-box">
                <h3>Por turno</h3>
                <GraficoTurnos dados={dadosTurnos} />
              </div>

              <div className="grafico-box">
                <h3>Por responsável pela ocorrência</h3>
                <GraficoProfessores dados={dadosProfessores} />
              </div>

              <div className="grafico-box">
                <h3>Por aluno</h3>
                <GraficoSimples dados={dadosAlunos} dataKey="aluno" />
              </div>

              <div className="grafico-box">
                <h3>Por ocorrência</h3>
                <GraficoSimples dados={dadosTipos} dataKey="tipo" />
              </div>
            </section>

            {incluirRegistros && <section className="relatorio-tabela">
              <h2>Registros filtrados</h2>

              {dadosFiltrados.length === 0 ? (
                <p>Nenhuma ocorrência para listar.</p>
              ) : (
                <div className="relatorio-registros">
                  {dadosFiltrados.map((item) => (
                    <article key={item.id}>
                      <strong>{item.data}</strong>
                      <span>
                        {item.turma} • {item.turno} • {item.professorNome}
                      </span>
                      <p>
                        <b>Alunos:</b> {(item.alunos || []).join(", ") || "-"}
                      </p>
                      <p>
                        <b>Ocorrências:</b> {(item.tipos || []).join(", ") || "-"}
                      </p>
                      {item.observacao && <p>{item.observacao}</p>}
                    </article>
                  ))}
                </div>
              )}
            </section>}
          </div>
        </main>
      </div>
    </div>
  );
}

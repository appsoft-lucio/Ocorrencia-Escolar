import "./relatorios.css";

import { useContext, useMemo, useState } from "react";
import html2pdf from "html2pdf.js";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import GraficoProfessores from "../../components/graficos/graficoProfessor.jsx";
import GraficoTurmas from "../../components/graficos/graficoTurmas.jsx";
import GraficoTurnos from "../../components/graficos/graficoTurno.jsx";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

const FILTROS_INICIAIS = {
  alunos: [],
  dataFim: "",
  dataInicio: "",
  professores: [],
  tipos: [],
  turmas: [],
  turnos: [],
};

function dataOcorrenciaParaISO(data) {
  if (!data) return "";

  const [dataParte] = data.split(",");
  const partes = dataParte.trim().split(/[/-]/);

  if (partes.length !== 3) return "";

  const [primeiro, segundo, terceiro] = partes;

  if (primeiro.length === 4) {
    return `${primeiro}-${segundo.padStart(2, "0")}-${terceiro.padStart(2, "0")}`;
  }

  return `${terceiro}-${segundo.padStart(2, "0")}-${primeiro.padStart(2, "0")}`;
}

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
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados}>
        <XAxis dataKey={dataKey} />
        <YAxis allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="ocorrencias" fill="#ff7a00" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function Relatorios() {
  const { ocorrencias } = useContext(OcorrenciaContext);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);

  const listas = useMemo(
    () => ({
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

  const gerarPDF = () => {
    const el = document.getElementById("relatorio-pdf");

    html2pdf()
      .set({
        margin: 0.5,
        filename: "relatorio-escolar.pdf",
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
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
              titulo="Professores"
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
          </section>

          <div id="relatorio-pdf">
            <section className="print-header">
              <h1>Relatório escolar</h1>
              <p>Gerado em: {new Date().toLocaleDateString("pt-BR")}</p>
            </section>

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
                <h3>Professores</h3>
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
                  <strong>{resumo.professores}</strong> professor(es).
                </p>
              )}
            </section>

            <section className="relatorios-graficos">
              <div className="grafico-box">
                <h3>Por turma</h3>
                <GraficoTurmas dados={dadosTurmas} />
              </div>

              <div className="grafico-box">
                <h3>Por turno</h3>
                <GraficoTurnos dados={dadosTurnos} />
              </div>

              <div className="grafico-box">
                <h3>Por professor</h3>
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

            <section className="relatorio-tabela">
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
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

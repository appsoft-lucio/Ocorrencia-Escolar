import "./relatorios.css";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

import { useMemo, useState } from "react";

import html2pdf from "html2pdf.js";

/* GRÁFICOS */
import GraficoTurmas from "../../components/graficos/graficoTurmas.jsx";
import GraficoTurnos from "../../components/graficos/graficoTurno.jsx";
import GraficoProfessores from "../../components/graficos/garficoProfessor.jsx";

/* =========================
   DADOS DEMO (SAAS)
========================= */
const ocorrenciasFicticias = [
  {
    id: 1,
    turma: "1A",
    turno: "Manhã",
    professorNome: "Ana Silva",
    alunos: ["João", "Maria"],
    data: "2026-06-10",
    tipos: ["Indisciplina"],
  },
  {
    id: 2,
    turma: "1B",
    turno: "Tarde",
    professorNome: "Carlos Souza",
    alunos: ["Pedro"],
    data: "2026-06-11",
    tipos: ["Atraso"],
  },
  {
    id: 3,
    turma: "2A",
    turno: "Manhã",
    professorNome: "Marcos Lima",
    alunos: ["Lucas", "Ana"],
    data: "2026-06-12",
    tipos: ["Conversas"],
  },
  {
    id: 4,
    turma: "2B",
    turno: "Noite",
    professorNome: "Fernanda Alves",
    alunos: ["Bruno"],
    data: "2026-06-12",
    tipos: ["Falta de atenção"],
  },
  {
    id: 5,
    turma: "3A",
    turno: "Tarde",
    professorNome: "Ana Silva",
    alunos: ["Juliana"],
    data: "2026-06-13",
    tipos: ["Desatenção"],
  },
  {
    id: 6,
    turma: "1A",
    turno: "Manhã",
    professorNome: "Carlos Souza",
    alunos: ["João"],
    data: "2026-06-13",
    tipos: ["Indisciplina"],
  },
  {
    id: 7,
    turma: "2A",
    turno: "Noite",
    professorNome: "Marcos Lima",
    alunos: ["Pedro"],
    data: "2026-06-14",
    tipos: ["Falta de tarefa"],
  },
  {
    id: 8,
    turma: "3B",
    turno: "Tarde",
    professorNome: "Fernanda Alves",
    alunos: ["Maria"],
    data: "2026-06-14",
    tipos: ["Atraso"],
  },
];

export default function Relatorios() {
  /* =========================
     FILTROS
  ========================= */
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);
  const [turnosSelecionados, setTurnosSelecionados] = useState([]);
  const [professoresSelecionados, setProfessoresSelecionados] = useState([]);
  const [alunosSelecionados, setAlunosSelecionados] = useState([]);

  const toggleItem = (lista, setLista, valor) => {
    setLista(
      lista.includes(valor)
        ? lista.filter((i) => i !== valor)
        : [...lista, valor],
    );
  };

  /* =========================
     DADOS FILTRADOS
  ========================= */
  const dadosFiltrados = useMemo(() => {
    return ocorrenciasFicticias.filter((item) => {
      const turmaOk =
        turmasSelecionadas.length === 0 ||
        turmasSelecionadas.includes(item.turma);

      const turnoOk =
        turnosSelecionados.length === 0 ||
        turnosSelecionados.includes(item.turno);

      const profOk =
        professoresSelecionados.length === 0 ||
        professoresSelecionados.includes(item.professorNome);

      const alunoOk =
        alunosSelecionados.length === 0 ||
        item.alunos.some((a) => alunosSelecionados.includes(a));

      return turmaOk && turnoOk && profOk && alunoOk;
    });
  }, [
    turmasSelecionadas,
    turnosSelecionados,
    professoresSelecionados,
    alunosSelecionados,
  ]);

  /* =========================
     LISTAS
  ========================= */
  const turmas = [...new Set(ocorrenciasFicticias.map((o) => o.turma))];
  const turnos = ["Manhã", "Tarde", "Noite"];
  const professores = [
    ...new Set(ocorrenciasFicticias.map((o) => o.professorNome)),
  ];
  const alunos = [...new Set(ocorrenciasFicticias.flatMap((o) => o.alunos))];

  /* =========================
     GRÁFICOS
  ========================= */
  const dadosTurmas = useMemo(() => {
    const map = new Map();
    dadosFiltrados.forEach((o) =>
      map.set(o.turma, (map.get(o.turma) || 0) + 1),
    );
    return Array.from(map, ([turma, ocorrencias]) => ({ turma, ocorrencias }));
  }, [dadosFiltrados]);

  const dadosTurnos = useMemo(() => {
    const map = new Map();
    dadosFiltrados.forEach((o) =>
      map.set(o.turno, (map.get(o.turno) || 0) + 1),
    );
    return Array.from(map, ([turno, ocorrencias]) => ({ turno, ocorrencias }));
  }, [dadosFiltrados]);

  const dadosProfessores = useMemo(() => {
    const map = new Map();
    dadosFiltrados.forEach((o) =>
      map.set(o.professorNome, (map.get(o.professorNome) || 0) + 1),
    );
    return Array.from(map, ([professor, ocorrencias]) => ({
      professor,
      ocorrencias,
    }));
  }, [dadosFiltrados]);

  /* =========================
     PDF
  ========================= */
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
      {/* APP VIEW */}
      <Sidebar />

      <div className="relatorios-main">
        <Header />

        <main className="relatorios-main-content">
          {/* AÇÕES */}
          <div className="relatorios-actions">
            <button onClick={gerarPDF}>Exportar PDF</button>
            <button onClick={imprimir}>Imprimir</button>
          </div>

          {/* =========================
              RELATÓRIO (ÁREA LIMPA)
          ========================= */}
          <div id="relatorio-pdf">
            {/* HEADER DO RELATÓRIO */}
            <section className="print-header">
              <h1>Relatório Escolar</h1>
              <p>Gerado em: {new Date().toLocaleDateString()}</p>
            </section>

            {/* RESUMO */}
            <section className="relatorios-cards">
              <div className="card">
                <h3>Ocorrências</h3>
                <span>{dadosFiltrados.length}</span>
              </div>

              <div className="card">
                <h3>Alunos</h3>
                <span>
                  {new Set(dadosFiltrados.flatMap((o) => o.alunos)).size}
                </span>
              </div>

              <div className="card">
                <h3>Professores</h3>
                <span>
                  {new Set(dadosFiltrados.map((o) => o.professorNome)).size}
                </span>
              </div>
            </section>

            {/* GRÁFICOS */}
            <section className="relatorios-graficos">
              <div className="grafico-box">
                <h3>Turmas</h3>
                <GraficoTurmas dados={dadosTurmas} />
              </div>

              <div className="grafico-box">
                <h3>Turnos</h3>
                <GraficoTurnos dados={dadosTurnos} />
              </div>

              <div className="grafico-box">
                <h3>Professores</h3>
                <GraficoProfessores dados={dadosProfessores} />
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

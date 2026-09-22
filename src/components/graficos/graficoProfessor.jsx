import GraficoBarrasHorizontais from "./GraficoBarrasHorizontais";

export default function GraficoProfessores({ dados }) {
  return (
    <GraficoBarrasHorizontais dados={dados} dataKey="professor" />
  );
}

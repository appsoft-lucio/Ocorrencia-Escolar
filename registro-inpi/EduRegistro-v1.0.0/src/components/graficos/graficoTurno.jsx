import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function GraficoTurnos({ dados }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={dados}>
        <XAxis dataKey="turno" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="ocorrencias" fill="#ff7a00" />
      </BarChart>
    </ResponsiveContainer>
  );
}

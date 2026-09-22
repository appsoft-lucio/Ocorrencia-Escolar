import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const LIMITE_ROTULO = 16;

function abreviarRotulo(valor) {
  const texto = String(valor ?? "");
  return texto.length > LIMITE_ROTULO
    ? `${texto.slice(0, LIMITE_ROTULO - 1).trimEnd()}…`
    : texto;
}

export default function GraficoBarrasHorizontais({ dados, dataKey }) {
  const altura = Math.max(220, dados.length * 42);

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 4, right: 12, bottom: 4, left: 0 }}
      >
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey={dataKey}
          width={112}
          tickFormatter={abreviarRotulo}
        />
        <Tooltip
          formatter={(valor) => [valor, "Ocorrências"]}
          labelFormatter={(rotulo) => String(rotulo)}
        />
        <Bar dataKey="ocorrencias" fill="#ff7a00" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

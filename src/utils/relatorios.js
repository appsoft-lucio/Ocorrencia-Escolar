export const DIAS_SEMANA = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function dataOcorrenciaParaISO(valor) {
  const texto = String(valor || "").trim();
  const iso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ,])/);
  const br = texto.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:$|[ ,])/);
  if (!iso && !br) return "";
  const [ano, mes, dia] = iso ? iso.slice(1) : [br[3], br[2].padStart(2, "0"), br[1].padStart(2, "0")];
  const resultado = `${ano}-${mes}-${dia}`;
  const data = new Date(`${resultado}T12:00:00Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === resultado ? resultado : "";
}

export function diaSemanaOcorrencia(valor) {
  const iso = dataOcorrenciaParaISO(valor);
  return iso ? DIAS_SEMANA[new Date(`${iso}T12:00:00Z`).getUTCDay()] : "";
}

export function rotuloHorario(horario) {
  const texto = String(horario || "").trim();
  return texto ? `${texto}ª aula` : "";
}

export function maiorFrequencia(dados, chave) {
  if (!dados.length) return "Sem registros";
  const maior = Math.max(...dados.map(item => item.ocorrencias));
  return `${dados.filter(item => item.ocorrencias === maior).map(item => item[chave]).join(", ")} (${maior})`;
}

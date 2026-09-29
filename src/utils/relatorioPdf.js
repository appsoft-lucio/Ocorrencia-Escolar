import { jsPDF } from "jspdf";

// Desenha diretamente no A4: independente das medidas do SVG na tela.
export function criarRelatorioPdf({ resumo, destaques, graficos, filtros = {}, registros = [], demonstracao = false, geradoEm = new Date().toLocaleDateString("pt-BR") }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const margem = 16;
  const largura = 178;
  const limite = 276;
  let y = 16;
  const textoSeguro = (valor) => String(valor ?? "").replace(/[\u2013\u2014]/g, "-");
  function cabecalho(titulo) {
    pdf.setFillColor(255, 122, 0);
    pdf.rect(margem, 14, largura, 1.5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(35, 45, 60);
    pdf.text(textoSeguro(titulo), margem, 26);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(90);
    pdf.text(`Relat\u00f3rio escolar | Gerado em ${geradoEm}`, margem, 33);
    y = 43;
  }
  function novaPagina(titulo) {
    pdf.addPage();
    cabecalho(titulo);
  }
  function paragrafo(texto, tamanho = 11, negrito = false) {
    pdf.setFont("helvetica", negrito ? "bold" : "normal");
    pdf.setFontSize(tamanho);
    pdf.setTextColor(35, 45, 60);
    const linhas = pdf.splitTextToSize(textoSeguro(texto), largura);
    for (const linha of linhas) {
      if (y + 5 > limite) novaPagina("Relat\u00f3rio escolar - continua\u00e7\u00e3o");
      pdf.setFont("helvetica", negrito ? "bold" : "normal");
      pdf.setFontSize(tamanho);
      pdf.text(linha, margem, y);
      y += tamanho * 0.48;
    }
    y += 3;
  }
  cabecalho("Relat\u00f3rio escolar");
  if (demonstracao) paragrafo("Demonstra\u00e7\u00e3o com dados fict\u00edcios da escola Teste.", 11, true);
  paragrafo(`${resumo.ocorrencias} ocorr\u00eancias | ${resumo.alunos} alunos | ${resumo.turmas} turmas | ${resumo.professores} professores | ${resumo.tipos} tipos`, 11, true);
  const rotulos = { materias: "Mat\u00e9rias", dataInicio: "Data inicial", dataFim: "Data final", turmas: "Turmas", turnos: "Turnos", professores: "Professores", alunos: "Alunos", tipos: "Tipos", dias: "Dias", horarios: "Hor\u00e1rios e turnos" };
  const selecionados = Object.entries(filtros).filter(([, valor]) => Array.isArray(valor) ? valor.length : Boolean(valor));
  if (!selecionados.length) paragrafo("Filtros: todos os registros dispon\u00edveis.", 10);
  for (const [campo, valor] of selecionados) paragrafo(`${rotulos[campo] || campo}: ${Array.isArray(valor) ? valor.join(", ") : valor}`, 10);
  y += 3;
  paragrafo("Maiores frequ\u00eancias", 14, true);
  for (const [titulo, valor] of destaques) paragrafo(`${titulo}: ${valor}`, 11);
  paragrafo("O professor indicado \u00e9 quem registrou as ocorr\u00eancias.", 9);

  for (const { titulo, dados, chave } of graficos) {
    novaPagina(titulo);
    if (!dados.length) { paragrafo("Nenhum registro para os filtros selecionados."); continue; }
    const maximo = Math.max(1, ...dados.map(item => item.ocorrencias));
    const inicioBarra = 99;
    const larguraBarra = 79;
    function escala() {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(90);
      pdf.text("Ocorr\u00eancias", inicioBarra, y);
      pdf.text(`M\u00e1ximo: ${maximo}`, 194, y, { align: "right" });
      y += 9;
    }
    escala();
    for (const item of dados) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const linhas = pdf.splitTextToSize(textoSeguro(item[chave]), 77);
      const altura = Math.max(13, linhas.length * 4.5 + 6);
      if (y + altura > limite) { novaPagina(`${titulo} - continua\u00e7\u00e3o`); escala(); }
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(35, 45, 60);
      pdf.text(linhas, margem, y + 4.5);
      pdf.setFillColor(245, 246, 248);
      pdf.rect(inicioBarra, y, larguraBarra, 7, "F");
      pdf.setFillColor(255, 122, 0);
      pdf.rect(inicioBarra, y, larguraBarra * item.ocorrencias / maximo, 7, "F");
      pdf.setFont("helvetica", "bold");
      pdf.text(String(item.ocorrencias), 194, y + 5, { align: "right" });
      y += altura;
    }
  }
  if (registros.length) {
    novaPagina("Registros detalhados");
    for (const item of registros) {
      if (y + 35 > limite) novaPagina("Registros detalhados - continua\u00e7\u00e3o");
      paragrafo(`${item.data} | ${item.turma} | ${item.turno} | ${item.horario || "-"}\u00aa aula`, 11, true);
      paragrafo(`Professor: ${item.professorNome}`, 10);
      paragrafo(`Mat\u00e9ria: ${item.disciplina || "N\u00e3o informada"}`, 10);
      paragrafo(`Alunos: ${(item.alunos || []).join(", ")}`, 10);
      paragrafo(`Tipos: ${(item.tipos || []).join(", ")}`, 10);
      if (item.observacao) paragrafo(item.observacao, 10);
      y += 4;
    }
  }
  const paginas = pdf.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(110);
    pdf.text(`${i} / ${paginas}`, 194, 287, { align: "right" });
  }
  return pdf;
}

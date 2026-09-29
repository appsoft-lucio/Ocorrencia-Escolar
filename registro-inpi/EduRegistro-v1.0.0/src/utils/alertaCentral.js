export const EVENTO_ALERTA_CENTRAL = "ocorrencia-escolar:alerta-central";

export function exibirAlertaCentral(mensagem, tipo = "info") {
  if (!mensagem || typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(EVENTO_ALERTA_CENTRAL, {
      detail: { mensagem, tipo },
    }),
  );
}

export function tipoAlertaDaMensagem(mensagem = "") {
  const texto = mensagem.toLocaleLowerCase("pt-BR");
  if (texto.startsWith("editando")) return "info";
  const indicaErro = [
    "não foi possível",
    "nao foi possivel",
    "informe ",
    "inválid",
    "invalid",
    "incorret",
    "deve ter",
    "já existe",
    "ja existe",
    "ainda não",
    "ainda nao",
    "indisponível",
    "indisponivel",
  ].some((termo) => texto.includes(termo));

  if (indicaErro) return "erro";

  const indicaSucesso = [
    "sucesso",
    "cadastrad",
    "adicionad",
    "atualizad",
    "alterad",
    "excluíd",
    "excluid",
    "reativad",
    "salva",
  ].some((termo) => texto.includes(termo));

  return indicaSucesso ? "sucesso" : "info";
}

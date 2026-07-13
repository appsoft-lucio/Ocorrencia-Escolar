import { useCallback, useState } from "react";

import { exibirAlertaCentral, tipoAlertaDaMensagem } from "../utils/alertaCentral";

export function useMensagemComAlerta(valorInicial = "") {
  const [mensagem, definirMensagem] = useState(valorInicial);

  const setMensagem = useCallback((novaMensagem) => {
    definirMensagem(novaMensagem);

    if (typeof novaMensagem === "string" && novaMensagem) {
      exibirAlertaCentral(novaMensagem, tipoAlertaDaMensagem(novaMensagem));
    }
  }, []);

  return [mensagem, setMensagem];
}

import "./AlertaCentral.css";

import { useEffect, useRef, useState } from "react";

import { EVENTO_ALERTA_CENTRAL } from "../../utils/alertaCentral";

function AlertaCentral() {
  const [alerta, setAlerta] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    function receberAlerta(event) {
      window.clearTimeout(timerRef.current);
      setAlerta(event.detail);
      timerRef.current = window.setTimeout(() => setAlerta(null), 3500);
    }

    window.addEventListener(EVENTO_ALERTA_CENTRAL, receberAlerta);

    return () => {
      window.removeEventListener(EVENTO_ALERTA_CENTRAL, receberAlerta);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!alerta) return null;

  return (
    <div className="alerta-central-camada" role="presentation">
      <div
        className={`alerta-central alerta-central-${alerta.tipo}`}
        role="alert"
        aria-live="assertive"
      >
        <span className="alerta-central-icone" aria-hidden="true">
          {alerta.tipo === "sucesso" ? "✓" : alerta.tipo === "erro" ? "!" : "i"}
        </span>
        <p>{alerta.mensagem}</p>
        <button type="button" onClick={() => setAlerta(null)} aria-label="Fechar aviso">
          ×
        </button>
      </div>
    </div>
  );
}

export default AlertaCentral;

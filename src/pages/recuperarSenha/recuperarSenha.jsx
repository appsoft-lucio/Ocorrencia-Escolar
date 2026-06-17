import "./recuperarSenha.css";

import { useState } from "react";

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const enviar = () => {
    if (!email) return;
    setEnviado(true);
  };

  return (
    <div className="recuperar-container">
      <div className="recuperar-card">
        <h1>Recuperar senha</h1>

        {!enviado ? (
          <>
            <p>Informe seu email para receber o link de redefinição.</p>

            <input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />

            <button type="button" onClick={enviar}>
              Enviar link
            </button>

            <small>
              Sem acesso ao email cadastrado? Peça ao seu superior para atualizar
              seu email nas configurações.
            </small>
          </>
        ) : (
          <p>
            Se este email estiver cadastrado, você receberá um link de redefinição.
            Caso não tenha mais acesso ao email, peça ao seu superior para atualizar
            o cadastro antes de tentar novamente.
          </p>
        )}
      </div>
    </div>
  );
}

export default RecuperarSenha;

import "./recuperarSenha.css";
import { useState } from "react";

function RecuperarSenha() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);

  const enviar = () => {
    if (!email) return;

    // futuro: chamar API
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
              onChange={(e) => setEmail(e.target.value)}
            />

            <button onClick={enviar}>
              Enviar link
            </button>
          </>
        ) : (
          <p>
            Se este email estiver cadastrado, você receberá um link de redefinição.
          </p>
        )}

      </div>
    </div>
  );
}

export default RecuperarSenha;
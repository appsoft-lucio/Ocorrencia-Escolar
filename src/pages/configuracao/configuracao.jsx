import "./configuracao.css";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";

function Configuracao() {
  const { user } = useContext(AuthContext);

  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const [sugestao, setSugestao] = useState("");

  const alterarSenha = () => {
    if (novaSenha !== confirmarSenha) {
      alert("Senhas não conferem");
      return;
    }

    alert("Senha alterada (demo)");
  };

  const enviarSugestao = () => {
    alert("Sugestão enviada: " + sugestao);
    setSugestao("");
  };

  return (
    <div className="configuracao-layout">
      <Sidebar />

      <div className="configuracao-main">
        <Header />

        <main className="configuracao-container">

          <h1>Configurações</h1>
          <p>Gerencie seu perfil, segurança e plano</p>

          {/* =========================
              PERFIL
          ========================= */}
          <section className="card-section">
            <h2>👤 Perfil</h2>

            <div className="card">
              <p><strong>Nome:</strong> {user.nome}</p>
              <p><strong>Email:</strong> {user.email || "não informado"}</p>
              <p><strong>Função:</strong> {user.role}</p>
            </div>
          </section>

          {/* =========================
              SEGURANÇA
          ========================= */}
          <section className="card-section">
            <h2>🔐 Segurança</h2>

            <div className="card form-card">
              <input
                type="password"
                placeholder="Senha atual"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />

              <input
                type="password"
                placeholder="Nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />

              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
              />

              <button onClick={alterarSenha}>
                Alterar senha
              </button>
            </div>
          </section>

          {/* =========================
              PLANO SAAS
          ========================= */}
          <section className="card-section">
            <h2>💳 Plano</h2>

            <div className="card">
              <p><strong>Plano:</strong> Básico (Demo)</p>
              <p><strong>Status:</strong> Ativo</p>
              <p><strong>Renovação:</strong> 30 dias</p>

              <button className="upgrade">
                Fazer upgrade
              </button>
            </div>
          </section>

          {/* =========================
              SUGESTÕES
          ========================= */}
          <section className="card-section">
            <h2>💡 Sugestões</h2>

            <div className="card form-card">
              <textarea
                placeholder="Envie sua sugestão para melhorias..."
                value={sugestao}
                onChange={(e) => setSugestao(e.target.value)}
              />

              <button onClick={enviarSugestao}>
                Enviar sugestão
              </button>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}

export default Configuracao;
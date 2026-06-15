// =========================
// ESTILOS E ASSETS
// =========================
import "./Login.css";
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

// =========================
// REACT
// =========================
import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Link } from "react-router-dom";

// =========================
// CONTEXTO DE AUTENTICAÇÃO
// =========================
import { AuthContext } from "../../context/AuthContext.jsx";

function Login() {
  // =========================
  // ESTADOS DO FORMULÁRIO
  // =========================
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // CONTEXTO + NAVEGAÇÃO
  // =========================
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // =========================
  // REDIRECIONAMENTO SE JÁ LOGADO
  // =========================
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // =========================
  // FUNÇÃO DE LOGIN
  // =========================
  function handleSubmit(e) {
    e.preventDefault();

    // validação simples
    if (!userName.trim()) {
      alert("Digite um usuário válido");
      return;
    }

    // =========================
    // DEFINIÇÃO DE PERFIL
    // =========================
    const role = userName.toLowerCase() === "direcao" ? "direcao" : "professor";

    // =========================
    // CRIA USUÁRIO
    // =========================
    const userData = {
      id: Date.now(),
      nome: userName,
      role: role,
    };

    // =========================
    // SALVA NO CONTEXTO
    // =========================
    login(userData);

    // ⚠️ IMPORTANTE:
    // não precisa navigate aqui
    // o useEffect já faz o redirecionamento
  }

  return (
    <div className="login-container">
      {/* =========================
          BANNER ESQUERDO
      ========================= */}
      <div className="login-banner">
        <div className="banner-content">
          <div className="logo-container">
            <img src={logo} alt="AppSoft" className="logo-img" />
          </div>

          <h2>Sistema de Ocorrência Escolar</h2>

          <p>
            Registre, acompanhe e gerencie ocorrências escolares de forma
            simples e organizada.
          </p>
        </div>
      </div>

      {/* =========================
          FORMULÁRIO
      ========================= */}
      <div className="login-card">
        <h2>Bem-vindo</h2>

        <p className="subtitle">Faça login para acessar o sistema</p>

        <form onSubmit={handleSubmit}>
          {/* USUÁRIO */}
          <div className="input-group">
            <label>Usuário ou E-mail</label>

            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Digite seu usuário"
            />
          </div>

          {/* SENHA (simulado) */}
          <div className="input-group">
            <label>Senha</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

          {/* BOTÃO */}
          <button type="submit">Entrar</button>
          <Link to="/recuperar-senha" className="login-recover">
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Login;

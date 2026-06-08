import "./Login.css";
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext.jsx";

function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Se já estiver logado → vai direto pro dashboard
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user]);

  function handleSubmit(e) {
    e.preventDefault();

    if (userName.trim() !== "") {
      login(userName);

      // redireciona após login
      navigate("/dashboard");
    } else {
      alert("Digite um usuário válido");
    }
  }

  return (
    <div className="login-container">
      <div className="login-banner">
        <div className="banner-content">
          <div className="logo-container">
            <img src={logo} alt="AppSoft" className="logo-img" />
          </div>

          <h2>Sistema de Ocorrência Escolar</h2>

          <p>
            Registre, acompanhe e gerencie ocorrências escolares de forma
            simples, rápida e organizada.
          </p>
        </div>
      </div>

      <div className="login-card">
        <h2>Bem-vindo</h2>
        <p className="subtitle">Faça login para acessar o sistema</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Usuário ou E-mail</label>

            <input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              type="text"
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="input-group">
            <label>Senha</label>

            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Digite sua senha"
            />
          </div>

          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;

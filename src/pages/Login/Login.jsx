import "./Login.css";

import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo-appsoft-orange-Photoroom.png";
import { AuthContext } from "../../context/AuthContext.jsx";
import { DEMO_USERS, encontrarUsuarioDemo } from "../../data/demoUsers";

const USUARIOS_VISIVEIS = DEMO_USERS.filter((usuario) => usuario.role === "professor");

function Login() {
  const [userName, setUserName] = useState("professor");
  const [password, setPassword] = useState("123");

  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  function handleSubmit(event) {
    event.preventDefault();

    const usuarioDemo = encontrarUsuarioDemo(userName, password);

    if (!usuarioDemo) {
      alert("Usuário ou senha inválidos para a demonstração.");
      return;
    }

    login({
      id: usuarioDemo.id,
      nome: usuarioDemo.nome,
      role: usuarioDemo.role,
      login: usuarioDemo.login,
    });
  }

  function preencherUsuarioDemo(usuario) {
    setUserName(usuario.login);
    setPassword(usuario.senha);
  }

  return (
    <div className="login-container">
      <div className="login-banner">
        <div className="banner-content">
          <div className="logo-container">
            <img src={logo} alt="AppSoft" className="logo-img" />
          </div>

          <h2>EduRegistro</h2>
          <strong>Acompanhamento e Gestão Escolar</strong>

          <p>
            Registre ocorrências, acompanhe cada caso e apoie decisões para uma
            escola mais organizada.
          </p>
        </div>
      </div>

      <div className="login-card">
        <h2>Bem-vindo</h2>

        <p className="subtitle">Faça login para acessar o sistema</p>

        <div className="login-demo-users" aria-label="Contas para apresentação">
          {USUARIOS_VISIVEIS.map((usuario) => (
            <button
              type="button"
              key={usuario.id}
              onClick={() => preencherUsuarioDemo(usuario)}
            >
              Usar Professor
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-usuario">Usuário</label>

            <input
              id="login-usuario"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Digite seu usuário"
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-senha">Senha</label>

            <input
              id="login-senha"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
            />
          </div>

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

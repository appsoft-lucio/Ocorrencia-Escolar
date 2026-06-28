import "./Login.css";

import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo-appsoft-orange-Photoroom.png";
import { AuthContext } from "../../context/AuthContext.jsx";
import { encontrarUsuarioDemo } from "../../data/demoUsers";

function Login() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  const { login, loginSupabase, supabaseConfigurado, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === "desenvolvedor" ? "/escolas" : "/dashboard");
    }
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setEnviando(true);

    try {
      const loginInformado = userName.trim();
      const podeTentarSupabase =
        supabaseConfigurado && loginInformado.includes("@");

      if (podeTentarSupabase) {
        await loginSupabase(loginInformado, password);
        return;
      }

      const usuarioDemo = encontrarUsuarioDemo(userName, password);

      if (!usuarioDemo) {
        alert("Usuario ou senha invalidos.");
        return;
      }

      login({
        id: usuarioDemo.id,
        nome: usuarioDemo.nome,
        role: usuarioDemo.role,
        login: usuarioDemo.login,
        escolaId: usuarioDemo.escolaId,
        escolaNome: usuarioDemo.escolaNome,
        escolaCidade: usuarioDemo.escolaCidade,
      });
    } catch (error) {
      alert(error.message || "Nao foi possivel entrar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-banner">
        <div className="banner-content">
          <div className="logo-container">
            <img src={logo} alt="AppSoft" className="logo-img" />
          </div>

          <h2>EduRegistro</h2>
          <strong>Acompanhamento e Gestao Escolar</strong>

          <p>
            Registre ocorrencias, acompanhe cada caso e apoie decisoes para uma
            escola mais organizada.
          </p>
        </div>
      </div>

      <div className="login-card">
        <h2>Bem-vindo</h2>

        <p className="subtitle">Faca login para acessar o sistema</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="login-usuario">Usuario</label>

            <input
              id="login-usuario"
              type="text"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              placeholder="Digite seu usuario"
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

          <button type="submit" disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
          <Link to="/recuperar-senha" className="login-recover">
            Esqueci minha senha
          </Link>
        </form>
      </div>
    </div>
  );
}

export default Login;

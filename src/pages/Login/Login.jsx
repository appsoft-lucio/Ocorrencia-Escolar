// Importa estilos da página Login
import "./Login.css";

// Importa logo do sistema
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

// Importa hooks do React
import { useState, useContext } from "react";

// Importa contexto de autenticação (login global)
import { AuthContext } from "../../Context/AuthContet.jsx";

// Componente Login
function Login() {
  // Estado para armazenar usuário digitado
  const [userName, setUserName] = useState("");

  // Estado para armazenar senha (ainda não validada)
  const [password, setPassword] = useState("");

  // Acessa função login do contexto global
  const { login } = useContext(AuthContext);

  // Função executada ao enviar o formulário
  function handleSubmit(e) {
    e.preventDefault(); // impede recarregar a página

    // Simulação de login (sem backend ainda)
    if (userName.trim() !== "") {
      // Envia nome para o contexto global
      login(userName);
    } else {
      alert("Digite um usuário válido");
    }
  }

  return (
    // Container principal da tela de login
    <div className="login-container">
      {/* Lado esquerdo (banner informativo) */}
      <div className="login-banner">
        <div className="banner-content">
          {/* Logo do sistema */}
          <div className="logo-container">
            <img src={logo} alt="AppSoft" className="logo-img" />
          </div>

          {/* Nome do sistema */}
          <h2>Sistema de Ocorrência Escolar</h2>

          {/* Descrição do sistema */}
          <p>
            Registre, acompanhe e gerencie ocorrências escolares de forma
            simples, rápida e organizada.
          </p>
        </div>
      </div>

      {/* Lado direito (formulário de login) */}
      <div className="login-card">
        {/* Título da tela */}
        <h2>Bem-vindo</h2>

        {/* Subtítulo explicativo */}
        <p className="subtitle">Faça login para acessar o sistema</p>

        {/* Formulário de login */}
        <form onSubmit={handleSubmit}>
          {/* Campo usuário */}
          <div className="input-group">
            <label>Usuário ou E-mail</label>

            <input
              type="text"
              placeholder="Digite seu usuário"
              // Atualiza estado do usuário
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>

          {/* Campo senha */}
          <div className="input-group">
            <label>Senha</label>

            <input
              type="password"
              placeholder="Digite sua senha"
              // Atualiza estado da senha
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Botão de login */}
          <button type="submit">Entrar</button>
        </form>
      </div>
    </div>
  );
}

// Exporta componente Login
export default Login;

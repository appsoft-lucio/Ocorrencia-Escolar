// Importa o arquivo CSS da página
import "./Login.css";

// Importa a logo da AppSoft
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

// Componente Login
function Login() {

  return (

    // Container principal da tela
    <div className="login-container">

      {/* Área esquerda */}
      <div className="login-banner">

        <div className="banner-content">

          {/* Container da logo */}
          <div className="logo-container">

            {/* Imagem da logo */}
            <img
              src={logo}
              alt="AppSoft"
              className="logo-img"
            />

          </div>

          {/* Nome do sistema */}
          <h2>
            Sistema de Ocorrência Escolar
          </h2>

          {/* Descrição */}
          <p>
            Registre, acompanhe e gerencie
            ocorrências escolares de forma
            simples, rápida e organizada.
          </p>

        </div>

      </div>

      {/* Área direita */}
      <div className="login-card">

        {/* Título */}
        <h2>Bem-vindo</h2>

        {/* Subtítulo */}
        <p className="subtitle">
          Faça login para acessar o sistema
        </p>

        {/* Formulário */}
        <form>

          {/* Campo usuário */}
          <div className="input-group">

            <label>
              Usuário ou E-mail
            </label>

            <input
              type="text"
              placeholder="Digite seu usuário"
            />

          </div>

          {/* Campo senha */}
          <div className="input-group">

            <label>
              Senha
            </label>

            <input
              type="password"
              placeholder="Digite sua senha"
            />

          </div>

          {/* Botão */}
          <button type="submit">
            Entrar
          </button>

        </form>

      </div>

    </div>

  );
}

// Exporta o componente
export default Login;
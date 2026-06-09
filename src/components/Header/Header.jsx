// =====================================
// IMPORTA O CSS
// =====================================

import "./Header.css";

// =====================================
// IMPORTA A LOGO
// =====================================

import logo from "../../assets/logo-appsoft-orange.png";

// =====================================
// COMPONENTE HEADER
// =====================================

function Header() {
  // Usuário temporário
  // Futuramente virá do AuthContext
  const usuario = "Administrador";

  return (
    <header className="header">
      {/* Logo e título */}
      <div className="header-left">
        <div>
          <h1>Dashboard</h1>

          <p>Sistema de Ocorrência Escolar</p>
        </div>
      </div>

      {/* Área do usuário */}
      <div className="header-user">
        <span>👤 {usuario}</span>

        <button>Sair</button>
      </div>
    </header>
  );
}

export default Header;

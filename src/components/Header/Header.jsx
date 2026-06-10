// =====================================
// IMPORTA O CSS
// =====================================

import "./Header.css";

// =====================================
// IMPORTA A LOGO
// =====================================

import logo from "../../assets/logo-appsoft-orange.png";

import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

// =====================================
// COMPONENTE HEADER
// =====================================

function Header() {
  // Usuário temporário
  // Futuramente virá do AuthContext
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const usuario = "Administrador";

  function handleLogout() {
    logout();
    navigate("/");
  }

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

        <button onClick={handleLogout}>Sair</button>
      </div>
    </header>
  );
}

export default Header;

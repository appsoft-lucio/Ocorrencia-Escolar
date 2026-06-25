import "./Header.css";

import { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";

function Header() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="header">
      <div className="header-left">
        <div>
          <h1>Dashboard</h1>
          <p>{user?.escolaNome || "EduRegistro"}</p>
        </div>
      </div>

      <div className="header-user">
        <span>{user?.nome || "Usuario"}</span>
        <button type="button" onClick={handleLogout}>
          Sair
        </button>
      </div>
    </header>
  );
}

export default Header;

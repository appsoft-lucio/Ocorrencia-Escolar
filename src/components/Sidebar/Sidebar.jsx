import "./Sidebar.css";

import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo-appsoft-orange-Photoroom.png";
import { AuthContext } from "../../context/AuthContext";

const GESTAO_ROLES = ["direcao", "coordenacao", "coordenador"];

function Sidebar() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isGestao = GESTAO_ROLES.includes(user?.role);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="AppSoft" className="sidebar-logo-img" />
      </div>

      <nav>
        <ul>
          <li>
            <Link to="/dashboard">Dashboard</Link>
          </li>

          <li>
            <Link to="/ocorrencias">Ocorrências</Link>
          </li>

          <li>
            <Link to="/alunos">Alunos</Link>
          </li>

          {isGestao && (
            <li>
              <Link to="/professores">Professores</Link>
            </li>
          )}

          {isGestao && (
            <li>
              <Link to="/coordenador">Coordenador</Link>
            </li>
          )}

          {isGestao && (
            <li>
              <Link to="/relatorios">Relatórios</Link>
            </li>
          )}

          <li>
            <Link to="/configuracao">Configurações</Link>
          </li>
        </ul>
      </nav>

      <button type="button" className="sidebar-footer" onClick={handleLogout}>
        Sair
      </button>
    </aside>
  );
}

export default Sidebar;

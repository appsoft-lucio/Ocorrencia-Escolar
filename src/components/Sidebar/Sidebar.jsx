// Importa CSS do componente
import "./Sidebar.css";

// Importa logo
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

// React hooks
import { useContext } from "react";

// Contexto de autenticação
import { AuthContext } from "../../context/AuthContext";

// React Router
import { useNavigate, Link } from "react-router-dom";

// Componente Sidebar
function Sidebar() {
  // Função logout do contexto
  const { logout } = useContext(AuthContext);

  // Navegação programática
  const navigate = useNavigate();

  // Função de logout
  function handleLogout() {
    logout(); // limpa usuário
    navigate("/"); // volta para login
  }

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="sidebar-logo">
        <img src={logo} alt="AppSoft" className="sidebar-logo-img" />
      </div>

      {/* MENU */}
      <nav>
        <ul>
          <li>
            <Link to="/dashboard">📊 Dashboard</Link>
          </li>

          <li>
            <Link to="/ocorrencias">📝 Ocorrências</Link>
          </li>

          <li>
            <Link to="#">👨‍🎓 Alunos</Link>
          </li>

          <li>
            <Link to="#">👨‍🏫 Professores</Link>
          </li>

          <li>
            <Link to="#">📈 Relatórios</Link>
          </li>

          <li>
            <Link to="#">⚙️ Configurações</Link>
          </li>
        </ul>
      </nav>

      {/* LOGOUT */}
      <div className="sidebar-footer" onClick={handleLogout}>
        🚪 Sair
      </div>
    </aside>
  );
}

export default Sidebar;

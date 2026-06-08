// Importa CSS do componente
import "./Sidebar.css";

// Importa logo
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

// Importa contexto de autenticação
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

// Importa navegação do React Router
import { useNavigate } from "react-router-dom";

// Componente Sidebar
function Sidebar() {
  // Pega função logout do contexto
  const { logout } = useContext(AuthContext);

  // Navegação entre páginas
  const navigate = useNavigate();

  // Função de logout
  function handleLogout() {
    // Remove usuário do sistema
    logout();

    // Redireciona para login
    navigate("/");
  }

  return (
    // Menu lateral
    <aside className="sidebar">
      {/* Logo da empresa */}
      <div className="sidebar-logo">
        <img src={logo} alt="AppSoft" className="sidebar-logo-img" />
      </div>

      {/* Menu principal */}
      <nav>
        <ul>
          <li>📊 Dashboard</li>
          <li>📝 Ocorrências</li>
          <li>👨‍🎓 Alunos</li>
          <li>👨‍🏫 Professores</li>
          <li>📈 Relatórios</li>
          <li>⚙️ Configurações</li>
        </ul>
      </nav>

      {/* Rodapé do menu */}
      <div
        className="sidebar-footer"
        onClick={handleLogout}
        style={{ cursor: "pointer" }}
      >
        🚪 Sair
      </div>
    </aside>
  );
}

export default Sidebar;

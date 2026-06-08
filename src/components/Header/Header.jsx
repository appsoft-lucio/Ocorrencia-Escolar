// Importa estilos do header
import "./Header.css";

// Importa contexto de autenticação
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

// Importa navegação
import { useNavigate } from "react-router-dom";

// Componente Header
function Header() {
  // Pega usuário e função logout do contexto
  const { user, logout } = useContext(AuthContext);

  // Navegação programática
  const navigate = useNavigate();

  // Função de sair
  function handleLogout() {
    // Executa logout (limpa estado + localStorage)
    logout();

    // Redireciona para login
    navigate("/");
  }

  return (
    <header className="header">
      {/* Nome do sistema */}
      <div className="header-title">Sistema Escolar</div>

      {/* Área do usuário */}
      <div className="header-user">
        {/* Mostra nome do usuário logado */}
        👤 {user?.name || "Visitante"}
        {/* Botão sair (só aparece se estiver logado) */}
        {user && <button onClick={handleLogout}>Sair</button>}
      </div>
    </header>
  );
}

export default Header;

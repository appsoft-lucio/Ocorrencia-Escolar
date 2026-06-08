// Importa o CSS do componente Header
import "./Header.css";

// Importa hook para acessar contexto global
import { useContext } from "react";

// Importa o contexto de autenticação
import { AuthContext } from "../../Context/AuthContet.jsx";

// Componente responsável pela barra superior do sistema
function Header() {
  // Acessa o usuário logado vindo do contexto global
  const { user } = useContext(AuthContext);

  return (
    // Container principal do header
    <header className="header">
      {/* Nome fixo do sistema (lado esquerdo) */}
      <div className="header-title">Sistema Escolar</div>

      {/* Área do usuário logado (lado direito) */}
      <div className="header-user">
        {/* Exibe nome do usuário ou fallback caso não esteja logado */}
        👤 {user ? user.name : "Visitante"}
      </div>
    </header>
  );
}

// Exporta o componente
export default Header;

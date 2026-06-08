// Importa estilos
import "./Header.css";

// Importa contexto
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

function Header() {
  // Pega usuário e logout do contexto
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      {/* Nome do sistema */}
      <div className="header-title">Sistema Escolar</div>

      {/* Área do usuário */}
      <div className="header-user">
        {/* Mostra nome ou visitante */}
        👤 {user ? user.name : "Visitante"}
        {/* Botão de sair (só aparece se logado) */}
        {user && (
          <button onClick={logout} style={{ marginLeft: "10px" }}>
            Sair
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;

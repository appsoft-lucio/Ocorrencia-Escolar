// Importa navegação do React Router
import { Navigate } from "react-router-dom";

// Importa contexto de autenticação
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Componente de proteção de rota
function PrivateRoute({ children }) {
  // Pega usuário logado
  const { user } = useContext(AuthContext);

  // Se não estiver logado → redireciona para login
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Se estiver logado → libera acesso
  return children;
}

export default PrivateRoute;

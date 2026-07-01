import { useContext } from "react";
import { Navigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";
import {
  normalizarPerfil,
  obterRotaInicial,
  podeAcessarModulo,
} from "../utils/permissoes";

function PrivateRoute({ children, allowedRoles, modulo }) {
  const { loading, user } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (modulo && !podeAcessarModulo(user, modulo)) {
    return <Navigate to={obterRotaInicial(user)} replace />;
  }

  if (
    allowedRoles?.length &&
    !allowedRoles.map(normalizarPerfil).includes(normalizarPerfil(user.role))
  ) {
    return <Navigate to={obterRotaInicial(user)} replace />;
  }

  return children;
}

export default PrivateRoute;

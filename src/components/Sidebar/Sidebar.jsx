import "./Sidebar.css";

import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo-appsoft-orange-Photoroom.png";
import { AuthContext } from "../../context/AuthContext";
import {
  MODULOS,
  perfilDesenvolvedor,
  podeAcessarModulo,
} from "../../utils/permissoes";

function Sidebar() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const isDesenvolvedor = perfilDesenvolvedor(user?.role);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <img src={logo} alt="AppSoft" className="sidebar-logo-img" />
        {user?.escolaNome && (
          <div className="sidebar-escola">
            <strong>{user.escolaNome}</strong>
            {user.escolaCidade && <span>{user.escolaCidade}</span>}
          </div>
        )}
        {isDesenvolvedor && (
          <div className="sidebar-escola">
            <strong>Painel do desenvolvedor</strong>
            <span>Cadastro de escolas</span>
          </div>
        )}
      </div>

      <nav>
        <ul>
          {isDesenvolvedor ? (
            <li>
              <Link to="/escolas">Escolas</Link>
            </li>
          ) : (
            <>
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>

              <li>
                <Link to="/ocorrencias">Ocorrencias</Link>
              </li>

              <li>
                <Link to="/alunos">Alunos</Link>
              </li>

              {podeAcessarModulo(user, MODULOS.PROFESSORES) && (
                <li>
                  <Link to="/professores">Professores</Link>
                </li>
              )}

              {podeAcessarModulo(user, MODULOS.USUARIOS) && (
                <li>
                  <Link to="/usuarios">Usuarios</Link>
                </li>
              )}

              {podeAcessarModulo(user, MODULOS.COORDENADOR) && (
                <li>
                  <Link to="/coordenador">Coordenador</Link>
                </li>
              )}

              {podeAcessarModulo(user, MODULOS.RELATORIOS) && (
                <li>
                  <Link to="/relatorios">Relatorios</Link>
                </li>
              )}

              <li>
                <Link to="/configuracao">Configuracoes</Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      <button type="button" className="sidebar-footer" onClick={handleLogout}>
        Sair
      </button>
    </aside>
  );
}

export default Sidebar;

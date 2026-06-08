// Importa o CSS do componente
import "./Sidebar.css";

// Importa a logo
import logo from "../../assets/logo-appsoft-orange-Photoroom.png";

// Componente Sidebar
function Sidebar() {

  return (

    // Menu lateral
    <aside className="sidebar">

      {/* Logo da empresa */}
      <div className="sidebar-logo">

  <img
    src={logo}
    alt="AppSoft"
    className="sidebar-logo-img"
  />

</div>

      {/* Menu principal */}
      <nav>

        <ul>

          <li>
            📊 Dashboard
          </li>

          <li>
            📝 Ocorrências
          </li>

          <li>
            👨‍🎓 Alunos
          </li>

          <li>
            👨‍🏫 Professores
          </li>

          <li>
            📈 Relatórios
          </li>

          <li>
            ⚙️ Configurações
          </li>

        </ul>

      </nav>

      {/* Rodapé do menu */}
      <div className="sidebar-footer">

        🚪 Sair

      </div>

    </aside>

  );

}

// Exporta o componente
export default Sidebar;
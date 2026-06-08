// Importa estilos da página Dashboard
import "./Dashboard.css";

// Importa componentes usados na página
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import StatsCard from "../../components/Cards/card.jsx";

// Importa dados do dashboard
import { dashboardData } from "../../data/dashboardData.js";

// Página principal do dashboard
function Dashboard() {
  return (
    <div className="dashboard-container">
      {/* Menu lateral */}
      <Sidebar />

      {/* Área principal */}
      <div className="dashboard-main">
        {/* Header superior */}
        <Header />

        <main className="dashboard-content">
          <h2>Painel Geral</h2>

          {/* Grid de cards */}
          <div className="cards">
            {/* Mapeia os dados dinamicamente */}
            {dashboardData.map((item, index) => (
              <StatsCard
                key={index}
                title={item.title}
                value={item.value}
                icon={item.icon}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

// Importa estilos da página Dashboard
import "./Dashboard.css";

// Hooks
import { useContext } from "react";

// Contexto de autenticação
import { AuthContext } from "../../context/AuthContext";

// Componentes
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import StatsCard from "../../components/Cards/Card";

// Dados do dashboard
import { dashboardData } from "../../data/dashboardData";

// Página Dashboard
function Dashboard() {
  // Acessa usuário logado
  const { user } = useContext(AuthContext);

  return (
    <div className="dashboard-container">
      {/* Sidebar lateral */}
      <Sidebar />

      <div className="dashboard-main">
        {/* Header superior */}
        <Header />

        <main className="dashboard-content">
          <h2>Painel Geral</h2>

          <div className="cards">
            {/* Renderização dinâmica dos cards */}
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

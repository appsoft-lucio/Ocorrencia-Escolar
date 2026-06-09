// =========================
// ESTILOS
// =========================
import "./Dashboard.css";

// =========================
// REACT
// =========================
import { useContext } from "react";

// =========================
// CONTEXTO
// =========================
import { AuthContext } from "../../context/AuthContext.jsx";

// =========================
// COMPONENTES
// =========================
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import StatsCard from "../../components/Cards/Card";

// =========================
// DADOS
// =========================
import { dashboardData } from "../../data/dashboardData";

function getDashboardData(role) {
  return dashboardData.filter((item) => {
    if (role === "direcao") return true;
    return item.role === "professor" || !item.role;
  });
}

function Dashboard() {
  const { user } = useContext(AuthContext);

  // =========================
  // LOADING SEGURO
  // =========================
  if (!user) {
    return <div className="loading-screen">Carregando sistema...</div>;
  }

  const isDirecao = user.role === "direcao";
  const dadosFiltrados = getDashboardData(user.role);

  return (
    <div className="dashboard-layout">
      {/* SIDEBAR */}
      <Sidebar />

      {/* CONTEÚDO PRINCIPAL */}
      <div className="dashboard-main">
        {/* HEADER */}
        <Header />

        {/* CONTEÚDO */}
        <main className="dashboard-content">
          {/* BOAS-VINDAS */}
          <div className="welcome-box">
            <h2>Bem-vindo, {user.nome}</h2>
            <p>Perfil: {isDirecao ? "Direção" : "Professor"}</p>
          </div>

          {/* CARDS */}
          <div className="cards-grid">
            {dadosFiltrados.map((item, index) => (
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

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

function Dashboard() {
  const { user } = useContext(AuthContext);

  // segurança
  if (!user) return <div>Carregando...</div>;

  // =========================
  // IDENTIFICA PERFIL
  // =========================
  const isDirecao = user.role === "direcao";

  // =========================
  // DADOS FILTRADOS (EXEMPLO)
  // =========================
  const dadosFiltrados = isDirecao
    ? dashboardData
    : dashboardData.filter((item) => item.role === "professor" || !item.role);

  return (
    <div className="dashboard-container">
      <Sidebar />

      <div className="dashboard-main">
        <Header />

        <main className="dashboard-content">
          {/* =========================
              BOAS-VINDAS
          ========================= */}
          <h2>Bem-vindo, {user.nome}</h2>

          <p>Perfil: {isDirecao ? "Direção" : "Professor"}</p>

          {/* =========================
              CARDS DINÂMICOS
          ========================= */}
          <div className="cards">
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

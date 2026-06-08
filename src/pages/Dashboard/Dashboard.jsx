// =========================
// ESTILOS
// =========================
import "./Dashboard.css";

// =========================
// REACT
// =========================
import { useContext } from "react";

// =========================
// CONTEXTO DE AUTENTICAÇÃO
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
  // =========================
  // USUÁRIO LOGADO
  // =========================
  const { user } = useContext(AuthContext);

  // =========================
  // SEGURANÇA: EVITA TELA BRANCA
  // =========================
  if (!user) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>Acessando sistema...</h2>
        <p>Carregando usuário.</p>
      </div>
    );
  }

  // =========================
  // FILTRO POR PERFIL
  // =========================
  // direção vê tudo
  // professor vê apenas dados dele (futuramente aplicado nas ocorrências)
  const isDirecao = user.role === "direcao";

  return (
    <div className="dashboard-container">
      {/* =========================
          SIDEBAR
      ========================= */}
      <Sidebar />

      <div className="dashboard-main">
        {/* =========================
            HEADER
        ========================= */}
        <Header user={user} />

        <main className="dashboard-content">
          {/* =========================
              BOAS-VINDAS
          ========================= */}
          <h2>Bem-vindo, {user?.nome}</h2>

          <p>Perfil: {user?.role === "direcao" ? "Direção" : "Professor"}</p>

          {/* =========================
              CARDS DO DASHBOARD
          ========================= */}
          <div className="cards">
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

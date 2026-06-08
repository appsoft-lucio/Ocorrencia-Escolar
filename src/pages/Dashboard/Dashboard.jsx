// Importa estilos
import "./Dashboard.css";

// Hooks
import { useContext } from "react";

// Contexto de autenticação
import { AuthContext } from "../../context/AuthContext";

// Contexto de ocorrências
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

// Componentes
import Sidebar from "../../components/Sidebar/Sidebar";
import Header from "../../components/Header/Header";
import StatsCard from "../../components/Cards/Card";

// Página Dashboard
function Dashboard() {
  // Usuário logado
  const { user } = useContext(AuthContext);

  // Dados de ocorrências
  const { ocorrencias } = useContext(OcorrenciaContext);

  // Proteção simples (redundância de segurança visual)
  if (!user) {
    return <h2>Acesso negado</h2>;
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <Sidebar />

      <div className="dashboard-main">
        {/* Header */}
        <Header />

        <main className="dashboard-content">
          <h2>Painel Geral</h2>

          <div className="cards">
            {/* =========================
                CARD DINÂMICO
            ========================= */}
            <StatsCard
              title="Ocorrências"
              value={ocorrencias.length}
              icon="📝"
            />

            <StatsCard
              title="Total de Registros"
              value={ocorrencias.length}
              icon="📊"
            />

            <StatsCard title="Sistema Ativo" value="Online" icon="🟢" />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;

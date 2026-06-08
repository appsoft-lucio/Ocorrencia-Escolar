// Importa o arquivo de estilos específico da página Dashboard
import "./Dashboard.css";

// Importa o componente Sidebar (menu lateral)
import Sidebar from "../../components/Sidebar/Sidebar";

// Componente da página Dashboard
function Dashboard() {
  return (
    // Container principal da página

    <div className="dashboard-container">
      {/*Componente do menu lateral */}
      <Sidebar />

      {/* Área principal de conteúdo da dashboard */}

      <main className="dashboard-content">
        {/* Título principal da página */}
        <h1>Dashboard</h1>

        {/* Mensagem de boas-vindas do sistema */}
        <p>Bem-vindo ao Sistema de Ocorrência Escolar.</p>
      </main>
    </div>
  );
}

// Exporta o componente para ser usado nas rotas ou App
export default Dashboard;

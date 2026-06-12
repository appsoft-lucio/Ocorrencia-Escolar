// Importa estilos globais da aplicação
import "./App.css";

// Importa sistema de rotas do React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importa páginas do sistema
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias.jsx";

// Importa provider de autenticação (controle global do usuário)
import { AuthProvider } from "./context/AuthContext.jsx";

// Importa provider de ocorrências (controle global do CRUD)
import { OcorrenciaProvider } from "./context/OcorrenciaContext.jsx";

// Importa proteção de rotas (bloqueia acesso sem login)
import PrivateRoute from "./routes/PrivateRoute.jsx";

// Componente principal da aplicação
function App() {
  return (
    // ==========================================
    // 🔐 CONTEXTO GLOBAL DE AUTENTICAÇÃO
    // ==========================================
    <AuthProvider>
      {/* ==========================================
          🗂 CONTEXTO GLOBAL DE OCORRÊNCIAS
          (necessário para Dashboard e CRUD funcionar)
      ========================================== */}
      <OcorrenciaProvider>
        {/* ======================================
            🌐 SISTEMA DE ROTAS DA APLICAÇÃO
        ====================================== */}
        <BrowserRouter
          basename={import.meta.env.PROD ? "/Ocorrencia-Escolar" : ""}
        >
          <Routes>
            {/* ======================================
                🔑 ROTA PÚBLICA - LOGIN
            ====================================== */}
            <Route path="/" element={<Login />} />

            {/* ======================================
                📊 DASHBOARD (PROTEGIDO)
                Só acessa se estiver logado
            ====================================== */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* ======================================
                📝 OCORRÊNCIAS (PROTEGIDA)
                Módulo principal do sistema
            ====================================== */}
            <Route
              path="/ocorrencias"
              element={
                <PrivateRoute>
                  <Ocorrencias />
                </PrivateRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </OcorrenciaProvider>
    </AuthProvider>
  );
}

// Exporta componente principal da aplicação
export default App;

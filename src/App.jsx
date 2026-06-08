// Importa estilos globais da aplicação
import "./App.css";

// Importa sistema de rotas do React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importa páginas do sistema
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias.jsx";

// Importa provider de autenticação (estado global do usuário)
import { AuthProvider } from "./context/AuthContext.jsx";

// Importa componente de proteção de rota
import PrivateRoute from "./routes/PrivateRoute.jsx";

// Componente principal da aplicação
function App() {
  return (
    // ==========================================
    // CONTEXTO GLOBAL DE AUTENTICAÇÃO
    // ==========================================
    <AuthProvider>
      {/* ======================================
        SISTEMA DE ROTAS
      ====================================== */}
      <BrowserRouter>
        <Routes>
          {/* ======================================
              🔑 ROTA DE LOGIN (pública)
          ====================================== */}
          <Route path="/" element={<Login />} />

          {/* ======================================
            DASHBOARD (PROTEGIDO)
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
              OCORRÊNCIAS (PROTEGIDA)
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
    </AuthProvider>
  );
}

// Exporta o componente principal
export default App;

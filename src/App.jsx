// Importa estilos globais da aplicação
import "./App.css";

// Importa sistema de rotas do React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importa páginas do sistema
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";
import RecuperarSenha from "./pages/recuperarSenha/recuperarSenha.jsx";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias.jsx";
import Alunos from "./pages/Alunos/Alunos.jsx";
import Professor from "./pages/professor/professor.jsx";
import Relatorios from "./pages/relatorios/relatorios.jsx";
import Configuracao from "./pages/configuracao/configuracao.jsx";
import Coordenador from "./pages/coordenador/Coordenador";

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
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
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

            <Route
              path="/alunos"
              element={
                <PrivateRoute>
                  <Alunos />
                </PrivateRoute>
              }
            />
            <Route
              path="/professores"
              element={
                <PrivateRoute allowedRoles={["direcao", "coordenacao", "coordenador"]}>
                  <Professor />
                </PrivateRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <PrivateRoute allowedRoles={["direcao", "coordenacao", "coordenador"]}>
                  <Relatorios />
                </PrivateRoute>
              }
            />
            <Route
              path="/configuracao"
              element={
                <PrivateRoute>
                  <Configuracao />
                </PrivateRoute>
              }
            />
            <Route
              path="/coordenador"
              element={
                <PrivateRoute>
                  <Coordenador />
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

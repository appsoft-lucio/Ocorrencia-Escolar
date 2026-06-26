import "./App.css";

import { HashRouter, Routes, Route } from "react-router-dom";

import AnalyticsTracker from "./components/AnalyticsTracker";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";
import RecuperarSenha from "./pages/recuperarSenha/recuperarSenha.jsx";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias.jsx";
import Alunos from "./pages/Alunos/Alunos.jsx";
import Professor from "./pages/professor/professor.jsx";
import Relatorios from "./pages/relatorios/relatorios.jsx";
import Configuracao from "./pages/configuracao/configuracao.jsx";
import Coordenador from "./pages/coordenador/Coordenador";
import Escolas from "./pages/escolas/Escolas.jsx";
import Usuarios from "./pages/usuarios/Usuarios.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { OcorrenciaProvider } from "./context/OcorrenciaContext.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";

const PERFIS_ESCOLA = [
  "diretor",
  "direcao",
  "vice_diretor",
  "coordenador",
  "coordenacao",
  "professor",
];

const PERFIS_GESTAO = [
  "diretor",
  "direcao",
  "vice_diretor",
  "coordenador",
  "coordenacao",
];

const PERFIS_USUARIOS = [
  "diretor",
  "direcao",
  "vice_diretor",
  "coordenador",
  "coordenacao",
];

function App() {
  return (
    <AuthProvider>
      <OcorrenciaProvider>
        <HashRouter>
          <AnalyticsTracker />

          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route
              path="/escolas"
              element={
                <PrivateRoute allowedRoles={["desenvolvedor"]}>
                  <Escolas />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute allowedRoles={PERFIS_ESCOLA}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/ocorrencias"
              element={
                <PrivateRoute allowedRoles={PERFIS_ESCOLA}>
                  <Ocorrencias />
                </PrivateRoute>
              }
            />
            <Route
              path="/alunos"
              element={
                <PrivateRoute allowedRoles={PERFIS_ESCOLA}>
                  <Alunos />
                </PrivateRoute>
              }
            />
            <Route
              path="/professores"
              element={
                <PrivateRoute allowedRoles={PERFIS_GESTAO}>
                  <Professor />
                </PrivateRoute>
              }
            />
            <Route
              path="/relatorios"
              element={
                <PrivateRoute allowedRoles={PERFIS_GESTAO}>
                  <Relatorios />
                </PrivateRoute>
              }
            />
            <Route
              path="/configuracao"
              element={
                <PrivateRoute allowedRoles={PERFIS_ESCOLA}>
                  <Configuracao />
                </PrivateRoute>
              }
            />
            <Route
              path="/usuarios"
              element={
                <PrivateRoute allowedRoles={PERFIS_USUARIOS}>
                  <Usuarios />
                </PrivateRoute>
              }
            />
            <Route
              path="/coordenador"
              element={
                <PrivateRoute allowedRoles={PERFIS_GESTAO}>
                  <Coordenador />
                </PrivateRoute>
              }
            />
          </Routes>
        </HashRouter>
      </OcorrenciaProvider>
    </AuthProvider>
  );
}

export default App;

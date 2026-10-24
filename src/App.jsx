import "./App.css";

import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import AnalyticsTracker from "./components/AnalyticsTracker";
import AlertaCentral from "./components/AlertaCentral/AlertaCentral";
import InstallPWA from "./components/InstallPWA/InstallPWA";
import OfflineStatus from "./components/OfflineStatus/OfflineStatus";

import { AuthProvider } from "./context/AuthContext.jsx";
import { OcorrenciaProvider } from "./context/OcorrenciaContext.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";
import { MODULOS } from "./utils/permissoes";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard.jsx"));
const Login = lazy(() => import("./pages/Login/Login.jsx"));
const RecuperarSenha = lazy(() => import("./pages/recuperarSenha/recuperarSenha.jsx"));
const Ocorrencias = lazy(() => import("./pages/Ocorrencias/Ocorrencias.jsx"));
const Alunos = lazy(() => import("./pages/Alunos/Alunos.jsx"));
const Turmas = lazy(() => import("./pages/turmas/Turmas.jsx"));
const Professor = lazy(() => import("./pages/professor/professor.jsx"));
const Relatorios = lazy(() => import("./pages/relatorios/relatorios.jsx"));
const Configuracao = lazy(() => import("./pages/configuracao/configuracao.jsx"));
const Escolas = lazy(() => import("./pages/escolas/Escolas.jsx"));
const Usuarios = lazy(() => import("./pages/usuarios/Usuarios.jsx"));

function App() {
  return (
    <AuthProvider>
      <OcorrenciaProvider>
        <HashRouter>
          <AnalyticsTracker />
          <AlertaCentral />
          <InstallPWA />
          <OfflineStatus />

          <Suspense fallback={<div role="status">Carregando...</div>}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route
                path="/escolas"
                element={
                  <PrivateRoute modulo={MODULOS.ESCOLAS}>
                    <Escolas />
                  </PrivateRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute modulo={MODULOS.DASHBOARD}>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/ocorrencias"
                element={
                  <PrivateRoute modulo={MODULOS.OCORRENCIAS}>
                    <Ocorrencias />
                  </PrivateRoute>
                }
              />
              <Route
                path="/alunos"
                element={
                  <PrivateRoute modulo={MODULOS.ALUNOS}>
                    <Alunos />
                  </PrivateRoute>
                }
              />
              <Route
                path="/turmas"
                element={
                  <PrivateRoute modulo={MODULOS.TURMAS}>
                    <Turmas />
                  </PrivateRoute>
                }
              />
              <Route
                path="/professores"
                element={
                  <PrivateRoute modulo={MODULOS.PROFESSORES}>
                    <Professor />
                  </PrivateRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <PrivateRoute modulo={MODULOS.RELATORIOS}>
                    <Relatorios />
                  </PrivateRoute>
                }
              />
              <Route
                path="/configuracao"
                element={
                  <PrivateRoute modulo={MODULOS.CONFIGURACAO}>
                    <Configuracao />
                  </PrivateRoute>
                }
              />
              <Route
                path="/vice-diretores"
                element={
                  <PrivateRoute modulo={MODULOS.VICE_DIRETORES}>
                    <Usuarios
                      titulo="Vice-diretor"
                      descricao="Cadastre vice-diretores e defina os dados de acesso."
                      perfilFixo="vice_diretor"
                      nomeSingular="vice-diretor"
                      nomePlural="vice-diretores"
                    />
                  </PrivateRoute>
                }
              />
              <Route
                path="/supervisao"
                element={
                  <PrivateRoute modulo={MODULOS.SUPERVISAO}>
                    <Usuarios
                      titulo="Supervisao"
                      descricao="Cadastre a supervisao e defina os dados de acesso."
                      perfilFixo="coordenador"
                      nomeSingular="supervisor"
                      nomePlural="supervisores"
                    />
                  </PrivateRoute>
                }
              />
            </Routes>
          </Suspense>
        </HashRouter>
      </OcorrenciaProvider>
    </AuthProvider>
  );
}

export default App;

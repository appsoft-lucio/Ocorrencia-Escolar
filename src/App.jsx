import "./App.css";

import { HashRouter, Routes, Route } from "react-router-dom";

import AnalyticsTracker from "./components/AnalyticsTracker";
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";
import RecuperarSenha from "./pages/recuperarSenha/recuperarSenha.jsx";
import Ocorrencias from "./pages/Ocorrencias/Ocorrencias.jsx";
import Alunos from "./pages/Alunos/Alunos.jsx";
import Turmas from "./pages/turmas/Turmas.jsx";
import Professor from "./pages/professor/professor.jsx";
import Relatorios from "./pages/relatorios/relatorios.jsx";
import Configuracao from "./pages/configuracao/configuracao.jsx";
import Escolas from "./pages/escolas/Escolas.jsx";
import Usuarios from "./pages/usuarios/Usuarios.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { OcorrenciaProvider } from "./context/OcorrenciaContext.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";
import { MODULOS } from "./utils/permissoes";

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
        </HashRouter>
      </OcorrenciaProvider>
    </AuthProvider>
  );
}

export default App;

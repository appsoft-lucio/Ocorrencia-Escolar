// Importa CSS global
import "./App.css";

// Router
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Páginas
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";

// Auth global
import { AuthProvider } from "./context/AuthContext.jsx";

// Componente principal da aplicação
function App() {
  return (
    // Provider global de autenticação
    <AuthProvider>
      {/* Sistema de rotas */}
      <BrowserRouter>
        <Routes>
          {/* Página de login */}
          <Route path="/" element={<Login />} />

          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* rota padrão */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

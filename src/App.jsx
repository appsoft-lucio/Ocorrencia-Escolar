// Importa CSS
import "./App.css";

// Importa páginas principais
import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import Login from "./pages/Login/Login.jsx";

// Importa Provider de autenticação
import { AuthProvider } from "./context/AuthContext.jsx";

// Componente principal da aplicação
function App() {
  return (
    // Envolve toda aplicação com o contexto de autenticação
    <AuthProvider>
      {/* Página inicial (aqui pode trocar depois com rotas) */}
      <Dashboard />
    </AuthProvider>
  );
}

// Exporta o App
export default App;

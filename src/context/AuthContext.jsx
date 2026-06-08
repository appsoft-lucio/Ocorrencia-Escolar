// Importa ferramentas do React
import { createContext, useState, useEffect } from "react";

// Cria contexto global de autenticação
export const AuthContext = createContext();

// Provider que envolve toda aplicação
export function AuthProvider({ children }) {
  // Estado do usuário logado
  const [user, setUser] = useState(null);

  // ==========================================
  // 🔐 CARREGAR USUÁRIO AO ABRIR A APLICAÇÃO
  // ==========================================
  useEffect(() => {
    // Busca usuário salvo no navegador
    const savedUser = localStorage.getItem("user");

    // Se existir, transforma de volta em objeto
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // ==========================================
  // 🔑 FUNÇÃO DE LOGIN
  // ==========================================
  function login(name) {
    // Cria objeto do usuário
    const userData = { name };

    // Salva no estado
    setUser(userData);

    // Salva no navegador (persistência)
    localStorage.setItem("user", JSON.stringify(userData));
  }

  // ==========================================
  // 🚪 FUNÇÃO DE LOGOUT
  // ==========================================
  function logout() {
    // Remove do estado
    setUser(null);

    // Remove do navegador
    localStorage.removeItem("user");
  }

  return (
    // Disponibiliza dados globalmente
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

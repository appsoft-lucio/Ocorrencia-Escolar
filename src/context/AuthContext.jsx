// Importa ferramentas do React para criar contexto e controlar estado
import { createContext, useState, useEffect } from "react";

// Cria o contexto global de autenticação
export const AuthContext = createContext();

// Provider que envolve toda aplicação
export function AuthProvider({ children }) {
  // Estado que armazena o usuário logado
  const [user, setUser] = useState(null);

  // ==========================================
  // CARREGAR USUÁRIO AO ABRIR A APLICAÇÃO
  // ==========================================
  useEffect(() => {
    // Busca usuário salvo no localStorage
    const storedUser = localStorage.getItem("user");

    // Se existir, converte de string para objeto e define no estado
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ==========================================
  // FUNÇÃO DE LOGIN
  // ==========================================
  function login(name) {
    // Cria objeto do usuário
    const userData = { name };

    // Atualiza estado global
    setUser(userData);

    // Salva no localStorage para persistência
    localStorage.setItem("user", JSON.stringify(userData));
  }

  // ==========================================
  // FUNÇÃO DE LOGOUT
  // ==========================================
  function logout() {
    // Remove usuário do estado (desloga imediatamente)
    setUser(null);

    // Remove usuário do localStorage (remove persistência)
    localStorage.removeItem("user");
  }

  return (
    // ==========================================
    // DISPONIBILIZA DADOS PARA A APLICAÇÃO
    // ==========================================
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

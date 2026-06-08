// Importa funções necessárias do React
import { createContext, useState } from "react";

// Cria o contexto de autenticação (compartilha dados entre componentes)
export const AuthContext = createContext();

// Provider (envolve a aplicação inteira e fornece dados globais)
export function AuthProvider({ children }) {
  // Estado que guarda o usuário logado
  const [user, setUser] = useState(null);

  // Função responsável por "logar" o usuário
  function login(name) {
    // Salva o usuário no estado global
    setUser({ name });
  }

  // Função para "deslogar" o usuário
  function logout() {
    // Remove o usuário do estado
    setUser(null);
  }

  return (
    // Disponibiliza user, login e logout para toda aplicação
    <AuthContext.Provider value={{ user, login, logout }}>
      {/* Renderiza toda aplicação dentro do provider */}
      {children}
    </AuthContext.Provider>
  );
}

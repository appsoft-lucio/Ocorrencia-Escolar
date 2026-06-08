// =========================
// IMPORTAÇÕES DO REACT
// =========================
import { createContext, useState, useEffect } from "react";

// =========================
// CONTEXTO GLOBAL
// =========================
export const AuthContext = createContext();

// =========================
// PROVIDER GLOBAL
// =========================
export function AuthProvider({ children }) {
  // =========================
  // USUÁRIO LOGADO
  // =========================
  const [user, setUser] = useState(null);

  // =========================
  // LOGIN
  // =========================
  function login(userData) {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  }

  // =========================
  // LOGOUT
  // =========================
  function logout() {
    setUser(null);
    localStorage.removeItem("user");
  }

  // =========================
  // RECUPERA SESSÃO (REFRESH DA PÁGINA)
  // =========================
  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");

      if (saved) {
        const parsedUser = JSON.parse(saved);

        // validação simples para evitar crash
        if (parsedUser && parsedUser.nome) {
          setUser(parsedUser);
        } else {
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      // se der erro de JSON inválido, limpa tudo
      console.error("Erro ao recuperar usuário:", error);
      localStorage.removeItem("user");
    }
  }, []);

  // =========================
  // CONTEXTO GLOBAL
  // =========================
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

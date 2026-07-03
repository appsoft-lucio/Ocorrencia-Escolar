import { createContext, useCallback, useEffect, useState } from "react";

import { usuarioDemoValido } from "../data/demoUsers";
import { supabase, supabaseConfigurado } from "../services/supabaseClient";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const carregarPerfilSupabase = useCallback(async (authUser) => {
    if (!supabase || !authUser) return null;

    const { data, error } = await supabase
      .from("perfis")
      .select(
        `
          id,
          nome,
          login,
          email,
          perfil,
          status,
          escola_id,
          escolas (
            nome,
            cidade,
            status
          )
        `,
      )
      .eq("id", authUser.id)
      .single();

    if (error) {
      throw new Error("Perfil nao encontrado para este usuario.");
    }

    if (data.status === "inativo" || data.escolas?.status === "inativo") {
      throw new Error("Usuario ou escola inativos.");
    }

    return {
      id: data.id,
      nome: data.nome,
      role: data.perfil,
      login: data.login || authUser.email,
      email: data.email || authUser.email,
      escolaId: data.escola_id,
      escolaNome: data.escolas?.nome,
      escolaCidade: data.escolas?.cidade,
      origem: "supabase",
    };
  }, []);

  function login(userData) {
    const userDataNormalizado = {
      ...userData,
      origem: userData.origem || "demo",
    };

    setUser(userDataNormalizado);
    localStorage.setItem("user", JSON.stringify(userDataNormalizado));
  }

  async function loginSupabase(usuario, senha) {
    if (!supabaseConfigurado || !supabase) {
      throw new Error("Supabase nao configurado.");
    }

    const usuarioInformado = usuario.trim();
    let email = usuarioInformado;

    if (!usuarioInformado.includes("@")) {
      const { data, error } = await supabase.rpc("email_por_usuario", {
        usuario_login: usuarioInformado,
      });

      if (error || !data) {
        throw new Error("Usuario ou senha invalidos.");
      }

      email = data;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      throw new Error("Usuario ou senha invalidos.");
    }

    const perfil = await carregarPerfilSupabase(data.user);
    login(perfil);
    return perfil;
  }

  async function logout() {
    if (supabase && user?.origem === "supabase") {
      await supabase.auth.signOut();
    }

    setUser(null);
    localStorage.removeItem("user");
  }

  useEffect(() => {
    let ativo = true;

    async function recuperarSessao() {
      if (supabaseConfigurado && supabase) {
        const { data } = await supabase.auth.getSession();

        if (data.session?.user) {
          try {
            const perfil = await carregarPerfilSupabase(data.session.user);

            if (ativo) {
              login(perfil);
              setLoading(false);
            }

            return;
          } catch (error) {
            console.error("Erro ao recuperar sessao Supabase:", error);
            await supabase.auth.signOut();
          }
        }
      }

      try {
        const saved = localStorage.getItem("user");

        if (saved) {
          const parsedUser = JSON.parse(saved);

          if (parsedUser?.origem === "supabase") {
            localStorage.removeItem("user");
          } else if (parsedUser?.nome && usuarioDemoValido(parsedUser)) {
            setUser(parsedUser);
          } else {
            localStorage.removeItem("user");
          }
        }
      } catch (error) {
        console.error("Erro ao recuperar usuario:", error);
        localStorage.removeItem("user");
      }

      if (ativo) {
        setLoading(false);
      }
    }

    recuperarSessao();

    return () => {
      ativo = false;
    };
  }, [carregarPerfilSupabase]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginSupabase,
        logout,
        supabaseConfigurado,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

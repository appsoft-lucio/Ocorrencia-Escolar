import { createContext, useCallback, useEffect, useState } from "react";

import { usuarioDemoValido } from "../data/demoUsers";
import { supabase, supabaseConfigurado } from "../services/supabaseClient";
import { isNetworkError, setOfflineUser, syncOffline } from "../services/offlineStore";

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
          turno,
          turmas,
          status,
          escola_id,
          escolas (
            nome,
            cidade,
            status,
            permitir_importacao_alunos
          )
        `,
      )
      .eq("id", authUser.id)
      .single();

    if (error) {
      throw new Error("Perfil nao encontrado para este usuario.", { cause: error });
    }

    if (data.status === "inativo" || data.escolas?.status === "inativo") {
      throw new Error("Usuario ou escola inativos.");
    }

    return {
      id: data.id,
      nome: data.nome,
      role: data.perfil,
      turno: data.turno || "",
      turmas: data.turmas || [],
      login: data.login || authUser.email,
      email: data.email || authUser.email,
      escolaId: data.escola_id,
      escolaNome: data.escolas?.nome,
      escolaCidade: data.escolas?.cidade,
      permitirImportacaoAlunos: Boolean(data.escolas?.permitir_importacao_alunos),
      origem: "supabase",
    };
  }, []);

  function login(userData) {
    const userDataNormalizado = {
      ...userData,
      origem: userData.origem || "demo",
    };

    setUser(userDataNormalizado);
    localStorage.removeItem("eduregistro-explicit-logout");
    setOfflineUser(userDataNormalizado.origem === "supabase" ? userDataNormalizado : null);
    localStorage.setItem("user", JSON.stringify(userDataNormalizado));
  }

  async function loginSupabase(usuario, senha) {
    if (navigator.onLine === false) throw new Error("O primeiro acesso exige internet. Para usar off-line, mantenha sua sessão aberta neste dispositivo.");
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
    localStorage.setItem("eduregistro-explicit-logout", "true");
    setOfflineUser(null);
    setUser(null);
    localStorage.removeItem("user");
    if (supabase && user?.origem === "supabase") {
      await supabase.auth.signOut({ scope: "local" });
    }

  }

  useEffect(() => {
    let ativo = true;

    async function recuperarSessao() {
      // signOut may fail without a network; an explicit exit must still stay signed out.
      if (localStorage.getItem("eduregistro-explicit-logout")) {
        setLoading(false);
        return;
      }
      const saved = localStorage.getItem("user");
      let cached;
      try { cached = saved ? JSON.parse(saved) : null; } catch { /* Ignore invalid session cache. */ }
      if (navigator.onLine === false && cached?.origem === "supabase") {
        login(cached);
        setLoading(false);
        return;
      }
      if (supabaseConfigurado && supabase) {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError && isNetworkError(sessionError) && cached?.origem === "supabase") {
          login(cached);
          setLoading(false);
          return;
        }

        if (data.session?.user) {
          try {
            const perfil = await carregarPerfilSupabase(data.session.user);

            if (ativo) {
              login(perfil);
              setLoading(false);
            }

            return;
          } catch (error) {
            if (isNetworkError(error) && cached?.id === data.session.user.id) {
              if (ativo) { login(cached); setLoading(false); }
              return;
            }
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

  useEffect(() => {
    if (user?.origem !== "supabase") return undefined;
    let active = true;
    let running = false;
    async function synchronize() {
      if (!active || running || navigator.onLine === false) return;
      running = true;
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session?.user || data.session.user.id !== user.id) {
          throw new Error("Sessão expirada. Entre novamente para sincronizar.");
        }
        const profile = await carregarPerfilSupabase(data.session.user);
        if (!active) return;
        setOfflineUser(profile);
        localStorage.setItem("user", JSON.stringify(profile));
        setUser((previous) => JSON.stringify(previous) === JSON.stringify(profile) ? previous : profile);
        await syncOffline(profile);
      } catch (error) {
        if (active) window.dispatchEvent(new CustomEvent("offline-auth-error", { detail: isNetworkError(error)
          ? "Sem conexão com o servidor. Seus dados locais estão disponíveis."
          : error.message }));
      } finally {
        running = false;
      }
    }
    const refresh = () => { if (active) setUser((previous) => previous ? { ...previous } : previous); };
    const accountChanged = (event) => {
      if (event.key !== "user" && event.key !== "eduregistro-explicit-logout") return;
      if (event.key === "user" && event.newValue) {
        try { if (JSON.parse(event.newValue).id === user.id) return; } catch { /* Treat invalid state as signed out. */ }
      }
      if (event.key === "eduregistro-explicit-logout" && !event.newValue) return;
      active = false;
      setOfflineUser(null);
      setUser(null);
    };
    const visible = () => { if (document.visibilityState === "visible") synchronize(); };
    window.addEventListener("online", synchronize);
    window.addEventListener("offline-pending", synchronize);
    window.addEventListener("offline-retry", synchronize);
    window.addEventListener("offline-data-updated", refresh);
    window.addEventListener("storage", accountChanged);
    document.addEventListener("visibilitychange", visible);
    const timer = setInterval(synchronize, 30000);
    synchronize();
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("online", synchronize);
      window.removeEventListener("offline-pending", synchronize);
      window.removeEventListener("offline-retry", synchronize);
      window.removeEventListener("offline-data-updated", refresh);
      window.removeEventListener("storage", accountChanged);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [user?.id, user?.escolaId, user?.origem, carregarPerfilSupabase]);

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

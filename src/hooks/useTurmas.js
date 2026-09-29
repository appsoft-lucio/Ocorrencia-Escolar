import { useEffect, useState } from "react";
import { listarTurmasSupabase } from "../services/cadastrosEscolaresService";

export function useTurmas(user) {
  const [turmas, setTurmas] = useState([]);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const dados = !user?.escolaId ? [] : user.origem === "supabase"
          ? await listarTurmasSupabase(user)
          : JSON.parse(localStorage.getItem(`turmasEscolares:${user.escolaId}`) || "[]");
        if (ativo) setTurmas(dados);
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
        if (ativo) setTurmas([]);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [user]);
  return turmas;
}

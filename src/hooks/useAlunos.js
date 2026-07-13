import { useCallback, useEffect, useState } from "react";

import { listarAlunosSupabase } from "../services/alunosService";

function chaveLocal(escolaId) {
  return `alunos:${escolaId}`;
}

export function useAlunos(user) {
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const usarSupabase = user?.origem === "supabase";

  const recarregar = useCallback(async () => {
    if (!user?.escolaId) {
      setAlunos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (usarSupabase) {
        setAlunos(await listarAlunosSupabase(user));
      } else {
        setAlunos(JSON.parse(localStorage.getItem(chaveLocal(user.escolaId)) || "[]"));
      }
    } finally {
      setLoading(false);
    }
  }, [usarSupabase, user]);

  useEffect(() => {
    queueMicrotask(() => {
      recarregar().catch((error) => console.error("Erro ao carregar alunos:", error));
    });
  }, [recarregar]);

  const salvarLocais = useCallback((proximos) => {
    setAlunos(proximos);
    localStorage.setItem(chaveLocal(user.escolaId), JSON.stringify(proximos));
  }, [user]);

  return { alunos, setAlunos, salvarLocais, recarregar, loading, usarSupabase };
}

import { podeAcessarTurma } from "../utils/turnos";
import { useCallback, useEffect, useMemo, useState } from "react";

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
    const anteriores = JSON.parse(localStorage.getItem(chaveLocal(user.escolaId)) || "[]");
    const preservados = anteriores.filter((item) => !podeAcessarTurma(user, item));
    localStorage.setItem(chaveLocal(user.escolaId), JSON.stringify([...preservados, ...proximos.filter((item) => podeAcessarTurma(user, item))]));
  }, [user]);

  const visiveis = useMemo(() => alunos.filter((item) => podeAcessarTurma(user, item)), [alunos, user]);

  return { alunos: visiveis, setAlunos, salvarLocais, recarregar, loading, usarSupabase };
}

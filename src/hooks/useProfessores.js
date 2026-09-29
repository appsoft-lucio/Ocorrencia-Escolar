import { useTurmas } from "./useTurmas";
import { podeAcessarProfessor, perfilRestritoPorTurno, podeAcessarTurno } from "../utils/turnos";
import { useEffect, useMemo, useState } from "react";

import { listarProfessoresSupabase } from "../services/perfisService";

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function normalizarProfessorLocal(professor) {
  return {
    ...professor,
    status: professor.status || "ativo",
  };
}

function lerProfessoresLocais(escolaId) {
  try {
    const stored = localStorage.getItem(criarChaveEscola("professores", escolaId));
    const parsed = stored ? JSON.parse(stored) : [];

    return Array.isArray(parsed) ? parsed.map(normalizarProfessorLocal) : [];
  } catch (error) {
    console.error("Erro ao carregar professores locais:", error);
    return [];
  }
}

function mapearProfessorSupabase(perfil) {
  return {
    id: perfil.id,
    nome: perfil.nome,
    disciplina: perfil.disciplina || "Nao informada",
    turmas: perfil.turmas || [],
    ocorrencias: 0,
    status: perfil.status,
    desativadoEm: perfil.status === "inativo" ? perfil.atualizadoEm : null,
    origem: "supabase",
  };
}

export function useProfessores(user) {
  const turmas = useTurmas(user);
  const [professores, setProfessores] = useState([]);
  const [loadingProfessores, setLoadingProfessores] = useState(false);

  useEffect(() => {
    let ativo = true;

    if (!user?.escolaId) {
      setProfessores([]);
      return undefined;
    }

    if (user.origem !== "supabase") {
      setProfessores(lerProfessoresLocais(user.escolaId));
      return undefined;
    }

    setLoadingProfessores(true);

    listarProfessoresSupabase(user)
      .then((perfis) => {
        if (ativo) {
          setProfessores(perfis.map(mapearProfessorSupabase));
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar professores:", error);
        if (ativo) {
          setProfessores([]);
        }
      })
      .finally(() => {
        if (ativo) {
          setLoadingProfessores(false);
        }
      });

    return () => {
      ativo = false;
    };
  }, [user]);

  const visiveis = useMemo(() => professores
    .filter((item) => podeAcessarProfessor(user, item, turmas))
    .map((item) => !perfilRestritoPorTurno(user?.role) ? item : {
      ...item,
      turmas: (item.turmas || []).filter((vinculo) => turmas.some((turma) =>
        (turma.codigo || turma.nome) === (typeof vinculo === "string" ? vinculo : vinculo.codigo) && podeAcessarTurno(user, turma))),
    }), [professores, user, turmas]);

  return {
    professores: visiveis,
    setProfessores,
    loadingProfessores,
  };
}

import { useEffect, useState } from "react";

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
    disciplina: "Nao informada",
    turno: "Nao informado",
    turmas: [],
    ocorrencias: 0,
    status: perfil.status,
    desativadoEm: perfil.status === "inativo" ? perfil.atualizadoEm : null,
    origem: "supabase",
  };
}

export function useProfessores(user) {
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

    listarProfessoresSupabase(user.escolaId)
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
  }, [user?.escolaId, user?.origem]);

  return {
    professores,
    setProfessores,
    loadingProfessores,
  };
}

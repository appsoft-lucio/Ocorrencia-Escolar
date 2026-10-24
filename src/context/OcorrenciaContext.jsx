import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";

import { AuthContext } from "./AuthContext.js";
import {
  atualizarStatusOcorrenciaSupabase,
  criarOcorrenciaSupabase,
  listarOcorrenciasSupabase,
} from "../services/ocorrenciasService";
import { perfilDesenvolvedor } from "../utils/permissoes";

import { podeAcessarTurma } from "../utils/turnos";

import { OcorrenciaContext } from "./OcorrenciaContext.js";

function criarChaveOcorrencias(escolaId) {
  return escolaId ? `ocorrencias:${escolaId}` : null;
}

function carregarOcorrenciasLocais(user) {
  if (!user?.escolaId || perfilDesenvolvedor(user.role) || user.origem === "supabase") return [];

  try {
    const saved = localStorage.getItem(criarChaveOcorrencias(user.escolaId));
    const dados = saved ? JSON.parse(saved) : [];
    return Array.isArray(dados) ? dados : [];
  } catch (error) {
    console.error("Erro ao carregar ocorrencias:", error);
    return [];
  }
}

export function OcorrenciaProvider({ children }) {
  const { user } = useContext(AuthContext);
  const chave = `${user?.id}:${user?.escolaId}:${user?.origem}:${user?.role}:${user?.turno}`;
  return <OcorrenciaProviderUsuario key={chave}>{children}</OcorrenciaProviderUsuario>;
}

function OcorrenciaProviderUsuario({ children }) {
  const { user } = useContext(AuthContext);
  const [ocorrencias, setOcorrencias] = useState(() => carregarOcorrenciasLocais(user));
  const usarSupabase = user?.origem === "supabase";
  const usuarioSemOcorrencias =
    !user || perfilDesenvolvedor(user.role) || !user.escolaId;
  const [loading, setLoading] = useState(() => usarSupabase && !usuarioSemOcorrencias);
  const storageKey = criarChaveOcorrencias(user?.escolaId);

  useEffect(() => {
    if (usuarioSemOcorrencias || !usarSupabase) return undefined;
    let ativo = true;

    listarOcorrenciasSupabase(user)
      .then((dados) => {
        if (ativo) setOcorrencias(dados);
      })
      .catch((error) => {
        console.error("Erro ao carregar ocorrencias no Supabase:", error);
        if (ativo) setOcorrencias([]);
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => { ativo = false; };
  }, [usarSupabase, user, usuarioSemOcorrencias]);

  useEffect(() => {
    if (usarSupabase || !storageKey || usuarioSemOcorrencias) return;
    localStorage.setItem(storageKey, JSON.stringify(ocorrencias));
  }, [ocorrencias, storageKey, usuarioSemOcorrencias, usarSupabase]);

  const addOcorrencia = useCallback(
    async (data) => {
      if (!podeAcessarTurma(user, data)) throw new Error("Turno nao permitido.");
      const novaOcorrencia = {
        ...data,
        escolaId: data.escolaId || user?.escolaId,
        escolaNome: data.escolaNome || user?.escolaNome,
      };

      if (usarSupabase) {
        if (!user?.escolaId) {
          throw new Error("Usuario sem escola vinculada.");
        }

        const ocorrenciaSalva = await criarOcorrenciaSupabase(novaOcorrencia, user);
        setOcorrencias((ocorrenciasAtuais) => [
          ocorrenciaSalva,
          ...ocorrenciasAtuais,
        ]);
        return ocorrenciaSalva;
      }

      setOcorrencias((ocorrenciasAtuais) => [
        ...ocorrenciasAtuais,
        novaOcorrencia,
      ]);
      return novaOcorrencia;
    },
    [usarSupabase, user],
  );

  const updateOcorrenciaStatus = useCallback(
    async (id, statusData) => {
      if (!ocorrencias.some((item) => item.id === id && podeAcessarTurma(user, item))) throw new Error("Ocorrencia sem permissao de acesso.");
      if (usarSupabase) {
        if (!user?.escolaId) {
          throw new Error("Usuario sem escola vinculada.");
        }

        const ocorrenciaAtualizada = await atualizarStatusOcorrenciaSupabase(
          id,
          statusData,
          user,
        );
        setOcorrencias((ocorrenciasAtuais) =>
          ocorrenciasAtuais.map((ocorrencia) =>
            ocorrencia.id === id ? ocorrenciaAtualizada : ocorrencia,
          ),
        );
        return ocorrenciaAtualizada;
      }

      setOcorrencias((ocorrenciasAtuais) =>
        ocorrenciasAtuais.map((ocorrencia) =>
          ocorrencia.id === id ? { ...ocorrencia, ...statusData } : ocorrencia,
        ),
      );
      return statusData;
    },
    [usarSupabase, user, ocorrencias],
  );

  const ocorrenciasVisiveis = useMemo(
    () => ocorrencias.filter((item) => podeAcessarTurma(user, item)),
    [ocorrencias, user],
  );

  return (
    <OcorrenciaContext.Provider
      value={{
        ocorrencias: ocorrenciasVisiveis,
        loading,
        addOcorrencia,
        updateOcorrenciaStatus,
      }}
    >
      {children}
    </OcorrenciaContext.Provider>
  );
}

OcorrenciaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

OcorrenciaProviderUsuario.propTypes = {
  children: PropTypes.node.isRequired,
};

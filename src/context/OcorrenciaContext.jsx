import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import PropTypes from "prop-types";

import { AuthContext } from "./AuthContext";
import {
  atualizarStatusOcorrenciaSupabase,
  criarOcorrenciaSupabase,
  listarOcorrenciasSupabase,
} from "../services/ocorrenciasService";

export const OcorrenciaContext = createContext();

function criarChaveOcorrencias(escolaId) {
  return escolaId ? `ocorrencias:${escolaId}` : null;
}

export function OcorrenciaProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [storagePronto, setStoragePronto] = useState(false);
  const [loading, setLoading] = useState(false);
  const usarSupabase = user?.origem === "supabase";
  const storageKey = useMemo(
    () => criarChaveOcorrencias(user?.escolaId),
    [user?.escolaId],
  );

  useEffect(() => {
    let ativo = true;

    if (usarSupabase) {
      setLoading(true);
      setStoragePronto(false);

      listarOcorrenciasSupabase(user)
        .then((dados) => {
          if (ativo) {
            setOcorrencias(dados);
          }
        })
        .catch((error) => {
          console.error("Erro ao carregar ocorrencias no Supabase:", error);
          if (ativo) {
            setOcorrencias([]);
          }
        })
        .finally(() => {
          if (ativo) {
            setLoading(false);
          }
        });

      return () => {
        ativo = false;
      };
    }

    setStoragePronto(false);

    if (!storageKey) {
      setOcorrencias([]);
      return;
    }

    const saved = localStorage.getItem(storageKey);

    if (!saved) {
      setOcorrencias([]);
      setStoragePronto(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      setOcorrencias(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Erro ao carregar ocorrencias:", error);
      localStorage.removeItem(storageKey);
      setOcorrencias([]);
    }

    setStoragePronto(true);
    return () => {
      ativo = false;
    };
  }, [storageKey, usarSupabase, user]);

  useEffect(() => {
    if (usarSupabase || !storageKey || !storagePronto) return;

    localStorage.setItem(storageKey, JSON.stringify(ocorrencias));
  }, [ocorrencias, storageKey, storagePronto, usarSupabase]);

  const addOcorrencia = useCallback(
    async (data) => {
      const novaOcorrencia = {
        ...data,
        escolaId: data.escolaId || user?.escolaId,
        escolaNome: data.escolaNome || user?.escolaNome,
      };

      if (usarSupabase) {
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
      if (usarSupabase) {
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
    [usarSupabase, user],
  );

  return (
    <OcorrenciaContext.Provider
      value={{
        ocorrencias,
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

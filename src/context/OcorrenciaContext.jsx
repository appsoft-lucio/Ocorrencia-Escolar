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

export const OcorrenciaContext = createContext();

function criarChaveOcorrencias(escolaId) {
  return escolaId ? `ocorrencias:${escolaId}` : null;
}

export function OcorrenciaProvider({ children }) {
  const { user } = useContext(AuthContext);
  const [ocorrencias, setOcorrencias] = useState([]);
  const [storagePronto, setStoragePronto] = useState(false);
  const storageKey = useMemo(
    () => criarChaveOcorrencias(user?.escolaId),
    [user?.escolaId],
  );

  useEffect(() => {
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
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey || !storagePronto) return;

    localStorage.setItem(storageKey, JSON.stringify(ocorrencias));
  }, [ocorrencias, storageKey, storagePronto]);

  const addOcorrencia = useCallback(
    (data) => {
      setOcorrencias((ocorrenciasAtuais) => [
        ...ocorrenciasAtuais,
        {
          ...data,
          escolaId: data.escolaId || user?.escolaId,
          escolaNome: data.escolaNome || user?.escolaNome,
        },
      ]);
    },
    [user?.escolaId, user?.escolaNome],
  );

  const updateOcorrenciaStatus = useCallback((id, statusData) => {
    setOcorrencias((ocorrenciasAtuais) =>
      ocorrenciasAtuais.map((ocorrencia) =>
        ocorrencia.id === id ? { ...ocorrencia, ...statusData } : ocorrencia,
      ),
    );
  }, []);

  return (
    <OcorrenciaContext.Provider
      value={{
        ocorrencias,
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

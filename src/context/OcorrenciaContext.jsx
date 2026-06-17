import { createContext, useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";

export const OcorrenciaContext = createContext();

export function OcorrenciaProvider({ children }) {
  const [ocorrencias, setOcorrencias] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("ocorrencias");

    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      setOcorrencias(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error);
      localStorage.removeItem("ocorrencias");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ocorrencias", JSON.stringify(ocorrencias));
  }, [ocorrencias]);

  const addOcorrencia = useCallback((data) => {
    setOcorrencias((ocorrenciasAtuais) => [...ocorrenciasAtuais, data]);
  }, []);

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

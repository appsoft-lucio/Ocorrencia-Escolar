// Importa ferramentas do React
import { createContext, useState, useEffect } from "react";

// Cria contexto global das ocorrências
export const OcorrenciaContext = createContext();

// Provider
export function OcorrenciaProvider({ children }) {
  // Lista de ocorrências
  const [ocorrencias, setOcorrencias] = useState([]);

  // Carrega dados salvos
  useEffect(() => {
    const saved = localStorage.getItem("ocorrencias");

    if (saved) {
      setOcorrencias(JSON.parse(saved));
    }
  }, []);

  // Salva sempre que mudar
  useEffect(() => {
    localStorage.setItem("ocorrencias", JSON.stringify(ocorrencias));
  }, [ocorrencias]);

  // Criar ocorrência
  function addOcorrencia(data) {
    setOcorrencias([...ocorrencias, data]);
  }

  // Remover ocorrência
  function removeOcorrencia(index) {
    const updated = ocorrencias.filter((_, i) => i !== index);

    setOcorrencias(updated);
  }

  return (
    <OcorrenciaContext.Provider
      value={{
        ocorrencias,
        addOcorrencia,
        removeOcorrencia,
      }}
    >
      {children}
    </OcorrenciaContext.Provider>
  );
}

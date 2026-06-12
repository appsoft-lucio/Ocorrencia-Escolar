import { createContext, useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";

export const OcorrenciaContext = createContext();

export function OcorrenciaProvider({ children }) {
  const [ocorrencias, setOcorrencias] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("ocorrencias");

    if (!saved) return;

    try {
      setOcorrencias(JSON.parse(saved));
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

  const removeOcorrencia = useCallback((id, alunoNome) => {
    setOcorrencias((ocorrenciasAtuais) =>
      ocorrenciasAtuais.flatMap((ocorrencia) => {
        if (ocorrencia.id !== id) return [ocorrencia];

        if (!alunoNome) return [];

        const alunosAtualizados = ocorrencia.alunos.filter(
          (aluno) => aluno !== alunoNome,
        );

        if (!alunosAtualizados.length) return [];

        return [{ ...ocorrencia, alunos: alunosAtualizados }];
      }),
    );
  }, []);

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

OcorrenciaProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

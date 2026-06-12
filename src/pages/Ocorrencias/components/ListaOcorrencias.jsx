import { memo } from "react";

import CardOcorrencia from "./CardOcorrencia";

function ListaOcorrencias({ ocorrencias, onRemoveOcorrencia }) {
  if (!ocorrencias.length) {
    return (
      <div className="ocorrencias-lista">
        <div className="ocorrencias-vazia">Nenhuma ocorrência encontrada.</div>
      </div>
    );
  }

  return (
    <div className="ocorrencias-lista">
      {ocorrencias.flatMap((ocorrencia) =>
        ocorrencia.alunos.map((aluno, index) => (
          <CardOcorrencia
            aluno={aluno}
            key={`${ocorrencia.id}-${index}`}
            ocorrencia={ocorrencia}
            onRemoveOcorrencia={onRemoveOcorrencia}
          />
        )),
      )}
    </div>
  );
}

export default memo(ListaOcorrencias);

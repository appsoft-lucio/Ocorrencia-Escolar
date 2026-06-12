import { memo } from "react";
import PropTypes from "prop-types";

import CardOcorrencia from "./CardOcorrencia";

const ocorrenciaShape = PropTypes.shape({
  alunos: PropTypes.arrayOf(PropTypes.string).isRequired,
  data: PropTypes.string.isRequired,
  disciplina: PropTypes.string.isRequired,
  horario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  id: PropTypes.number.isRequired,
  observacao: PropTypes.string,
  professorNome: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
  tipos: PropTypes.arrayOf(PropTypes.string),
  turma: PropTypes.string.isRequired,
  turno: PropTypes.string.isRequired,
});

function ListaOcorrencias({ ocorrencias, onRemoveOcorrencia }) {
  if (!ocorrencias.length) {
    return (
      <section className="ocorrencias-lista" aria-label="Lista de ocorrências">
        <div className="ocorrencias-vazia">Nenhuma ocorrência encontrada.</div>
      </section>
    );
  }

  return (
    <section className="ocorrencias-lista" aria-label="Lista de ocorrências">
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
    </section>
  );
}

ListaOcorrencias.propTypes = {
  ocorrencias: PropTypes.arrayOf(ocorrenciaShape).isRequired,
  onRemoveOcorrencia: PropTypes.func.isRequired,
};

export default memo(ListaOcorrencias);

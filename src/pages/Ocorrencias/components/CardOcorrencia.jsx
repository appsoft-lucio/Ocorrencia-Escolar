import { memo } from "react";
import PropTypes from "prop-types";

function CardOcorrencia({ aluno, ocorrencia, onRemoveOcorrencia }) {
  const tituloId = `ocorrencia-${ocorrencia.id}-${aluno}-titulo`;

  return (
    <article className="card-ocorrencia" aria-labelledby={tituloId}>
      <h3 id={tituloId}>{aluno}</h3>

      <p>
        <strong>Turma:</strong> {ocorrencia.turma}
      </p>

      <p>
        {ocorrencia.disciplina} - {ocorrencia.turno} - {ocorrencia.horario}º aula
      </p>

      <p>
        <strong>Tipos:</strong>{" "}
        {ocorrencia.tipos?.join(", ") || "Não informado"}
      </p>

      {ocorrencia.observacao && (
        <p>
          <strong>Obs:</strong> {ocorrencia.observacao}
        </p>
      )}

      <small>{ocorrencia.professorNome}</small>
      <small>{ocorrencia.data}</small>

      <p>
        Status: <strong>{ocorrencia.status}</strong>
      </p>

      <button
        type="button"
        aria-label={`Excluir ocorrência de ${aluno}`}
        onClick={() => onRemoveOcorrencia(ocorrencia.id, aluno)}
      >
        Excluir
      </button>
    </article>
  );
}

CardOcorrencia.propTypes = {
  aluno: PropTypes.string.isRequired,
  ocorrencia: PropTypes.shape({
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
  }).isRequired,
  onRemoveOcorrencia: PropTypes.func.isRequired,
};

export default memo(CardOcorrencia);

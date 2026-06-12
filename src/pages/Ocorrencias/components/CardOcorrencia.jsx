import { memo } from "react";

function CardOcorrencia({ aluno, ocorrencia, onRemoveOcorrencia }) {
  return (
    <div className="card-ocorrencia">
      <h3>{aluno}</h3>

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

      <button type="button" onClick={() => onRemoveOcorrencia(ocorrencia.id)}>
        Excluir
      </button>
    </div>
  );
}

export default memo(CardOcorrencia);

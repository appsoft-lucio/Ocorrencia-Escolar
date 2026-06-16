import PropTypes from "prop-types";
import "./professorCard.css";

function ProfessorCard({
  nome,
  disciplina,
  turno,
  turmas,
  ocorrencias,
  onEditar,
  onExcluir,
  onDetalhes,
}) {
  return (
    <div className="professor-card">
      {/* HEADER */}
      <div className="professor-header">
        <h3>{nome}</h3>
      </div>

      {/* BODY */}
      <div className="professor-body">
        <p>
          <strong>Disciplina:</strong> {disciplina}
        </p>

        <p>
          <strong>Turno:</strong> {turno}
        </p>

        <p>
          <strong>Turmas:</strong>{" "}
          {turmas?.length ? turmas.join(" • ") : "Sem turmas"}
        </p>

        <p>
          <strong>Ocorrências:</strong> {ocorrencias}
        </p>
      </div>

      {/* ACTIONS */}
      <div className="professor-actions">
        <button
          type="button"
          className="btn-detalhes"
          onClick={onDetalhes}
          title="Ver detalhes"
        >
          Detalhes
        </button>

        <button
          type="button"
          className="btn-editar"
          onClick={onEditar}
          title="Editar professor"
        >
          Editar
        </button>

        <button
          type="button"
          className="btn-excluir"
          onClick={onExcluir}
          title="Excluir professor"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

ProfessorCard.propTypes = {
  nome: PropTypes.string.isRequired,
  disciplina: PropTypes.string.isRequired,
  turno: PropTypes.string.isRequired,
  turmas: PropTypes.arrayOf(PropTypes.string).isRequired,
  ocorrencias: PropTypes.number.isRequired,
  onEditar: PropTypes.func,
  onExcluir: PropTypes.func,
  onDetalhes: PropTypes.func,
};

ProfessorCard.defaultProps = {
  onEditar: null,
  onExcluir: null,
  onDetalhes: null,
};

export default ProfessorCard;

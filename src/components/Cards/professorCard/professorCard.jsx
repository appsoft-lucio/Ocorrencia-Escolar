import PropTypes from "prop-types";
import "./professorCard.css";

function ProfessorCard({ nome, disciplina, turno, turmas, ocorrencias }) {
  return (
    <div className="professor-card">
      <div className="professor-header">
        <h3>{nome}</h3>
      </div>

      <div className="professor-body">
        <p>
          <strong>Disciplina:</strong> {disciplina}
        </p>

        <p>
          <strong>Turno:</strong> {turno}
        </p>

        <p>
          <strong>Turmas:</strong> {turmas.join(" • ")}
        </p>

        <p>
          <strong>Ocorrências:</strong> {ocorrencias}
        </p>
      </div>

      <button className="professor-btn">Ver detalhes</button>
    </div>
  );
}

ProfessorCard.propTypes = {
  nome: PropTypes.string.isRequired,
  disciplina: PropTypes.string.isRequired,
  turno: PropTypes.string.isRequired,
  turmas: PropTypes.arrayOf(PropTypes.string).isRequired,
  ocorrencias: PropTypes.number.isRequired,
};

export default ProfessorCard;

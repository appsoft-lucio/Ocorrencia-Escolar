import PropTypes from "prop-types";
import "./professorCard.css";

function ProfessorCard({
  nome,
  disciplina,
  turno,
  turmas,
  ocorrencias,
  status,
  desativadoEm,
  onEditar,
  onAlternarStatus,
  onDetalhes,
}) {
  const estaInativo = status === "inativo";

  return (
    <div className={`professor-card ${estaInativo ? "professor-card-inativo" : ""}`}>
      {/* HEADER */}
      <div className="professor-header">
        <h3>{nome}</h3>
        <span className={`professor-status ${estaInativo ? "inativo" : "ativo"}`}>
          {estaInativo ? "Desativado" : "Ativo"}
        </span>
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
        {estaInativo && desativadoEm && (
          <p>
            <strong>Desativado em:</strong>{" "}
            {new Date(desativadoEm).toLocaleDateString("pt-BR")}
          </p>
        )}
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
          className={estaInativo ? "btn-reativar" : "btn-desativar"}
          onClick={onAlternarStatus}
          title={estaInativo ? "Reativar professor" : "Desativar professor"}
        >
          {estaInativo ? "Reativar" : "Desativar"}
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
  status: PropTypes.string,
  desativadoEm: PropTypes.string,
  onEditar: PropTypes.func,
  onAlternarStatus: PropTypes.func,
  onDetalhes: PropTypes.func,
};

ProfessorCard.defaultProps = {
  status: "ativo",
  desativadoEm: null,
  onEditar: null,
  onAlternarStatus: null,
  onDetalhes: null,
};

export default ProfessorCard;

import { memo, useState } from "react";
import PropTypes from "prop-types";

const STATUS_OPCOES = [
  { valor: "Pendente", significado: "Aguardando análise" },
  { valor: "Confirmada", significado: "Foi comprovada" },
  { valor: "Não confirmada", significado: "Não foi comprovada" },
  { valor: "Cancelada", significado: "Registro feito por engano" },
];

function CardOcorrencia({
  aluno,
  canManage,
  ocorrencia,
  onStatusChange,
  normalizeStatus,
}) {
  const [mostrarControleStatus, setMostrarControleStatus] = useState(false);
  const tituloId = `ocorrencia-${ocorrencia.id}-${aluno}-titulo`;
  const status = normalizeStatus(ocorrencia.status);
  const statusInfo =
    STATUS_OPCOES.find((opcao) => opcao.valor === status) || STATUS_OPCOES[0];
  const classeStatus = status
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <article
      className={`card-ocorrencia card-ocorrencia-${classeStatus}`}
      aria-labelledby={tituloId}
    >
      <div className="card-ocorrencia-topo">
        <h3 id={tituloId}>{aluno}</h3>
        <span className={`status-badge status-${classeStatus}`}>{status}</span>
      </div>

      <p>
        <strong>Turma:</strong> {ocorrencia.turma}
      </p>

      <p>
        {ocorrencia.disciplina} - {ocorrencia.turno} - {ocorrencia.horario}ª aula
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

      <p className="card-ocorrencia-criacao">
        <strong>Criada por:</strong> {ocorrencia.professorNome}
        {ocorrencia.data ? ` em ${ocorrencia.data}` : ""}
      </p>

      <p className="card-ocorrencia-status">
        <strong>{status}:</strong> {statusInfo.significado}
      </p>

      {canManage && ocorrencia.statusAtualizadoPor && (
        <p className="card-ocorrencia-status-meta">
          <strong>Revisada por:</strong> {ocorrencia.statusAtualizadoPor}
          {ocorrencia.statusAtualizadoEm
            ? ` em ${ocorrencia.statusAtualizadoEm}`
            : ""}
        </p>
      )}

      {canManage && (
        <div className="card-status-acoes">
          <button
            type="button"
            className="btn-alterar-status"
            onClick={() => setMostrarControleStatus((mostrar) => !mostrar)}
          >
            Alterar status
          </button>

          {mostrarControleStatus && (
            <label className="card-status-controle">
              Novo status
              <select
                value={status}
                onChange={(event) => {
                  onStatusChange(ocorrencia.id, event.target.value);
                  setMostrarControleStatus(false);
                }}
              >
                {STATUS_OPCOES.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.valor}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </article>
  );
}

CardOcorrencia.propTypes = {
  aluno: PropTypes.string.isRequired,
  canManage: PropTypes.bool.isRequired,
  ocorrencia: PropTypes.shape({
    alunos: PropTypes.arrayOf(PropTypes.string).isRequired,
    data: PropTypes.string.isRequired,
    disciplina: PropTypes.string.isRequired,
    horario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id: PropTypes.number.isRequired,
    observacao: PropTypes.string,
    professorNome: PropTypes.string.isRequired,
    status: PropTypes.string,
    statusAtualizadoEm: PropTypes.string,
    statusAtualizadoPor: PropTypes.string,
    tipos: PropTypes.arrayOf(PropTypes.string),
    turma: PropTypes.string.isRequired,
    turno: PropTypes.string.isRequired,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
  normalizeStatus: PropTypes.func.isRequired,
};

export default memo(CardOcorrencia);

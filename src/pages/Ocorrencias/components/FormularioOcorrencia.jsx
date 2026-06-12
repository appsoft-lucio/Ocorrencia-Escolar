import { memo } from "react";
import PropTypes from "prop-types";

function FormularioOcorrencia({
  alunoInput,
  alunos,
  disciplina,
  disciplinas,
  horario,
  horarios,
  observacao,
  ocorrenciasTipo,
  outro,
  turma,
  turmas,
  turno,
  tiposOcorrencia,
  onAdicionarAluno,
  onAlunoInputChange,
  onCheckboxChange,
  onDisciplinaChange,
  onHorarioChange,
  onObservacaoChange,
  onOutroChange,
  onRemoverAluno,
  onSubmit,
  onTurmaChange,
  onTurnoChange,
  onVoltar,
}) {
  return (
    <section className="ocorrencias-form" aria-labelledby="titulo-form-ocorrencia">
      <h2 id="titulo-form-ocorrencia">Nova Ocorrência</h2>

      <form onSubmit={onSubmit}>
        <label className="campo-form" htmlFor="turno">
          Turno
        </label>
        <select
          id="turno"
          value={turno}
          onChange={(event) => onTurnoChange(event.target.value)}
          required
        >
          <option value="">Turno</option>
          <option value="manha">Manhã</option>
          <option value="tarde">Tarde</option>
          <option value="noite">Noite</option>
        </select>

        <label className="campo-form" htmlFor="turma">
          Turma
        </label>
        <select
          id="turma"
          value={turma}
          onChange={(event) => onTurmaChange(event.target.value)}
          required
        >
          <option value="">Turma</option>
          {turmas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className="campo-form" htmlFor="horario">
          Horário
        </label>
        <select
          id="horario"
          value={horario}
          onChange={(event) => onHorarioChange(event.target.value)}
        >
          <option value="">Horário</option>
          {horarios.map((item) => (
            <option key={item} value={item}>
              {item}º
            </option>
          ))}
        </select>

        <label className="campo-form" htmlFor="disciplina">
          Disciplina
        </label>
        <select
          id="disciplina"
          value={disciplina}
          onChange={(event) => onDisciplinaChange(event.target.value)}
          required
        >
          <option value="">Disciplina</option>
          {disciplinas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="aluno-box">
          <label className="campo-form" htmlFor="aluno">
            Aluno
          </label>
          <input
            id="aluno"
            value={alunoInput}
            onChange={onAlunoInputChange}
            placeholder="Aluno"
            aria-describedby="aluno-ajuda"
          />
          <button type="button" onClick={onAdicionarAluno}>
            Adicionar
          </button>
        </div>
        <small id="aluno-ajuda" className="texto-ajuda">
          Informe nome e sobrenome, com no mínimo 2 letras em cada palavra.
        </small>

        <div className="lista-alunos" aria-live="polite">
          {alunos.map((aluno) => (
            <div key={aluno.id}>
              {aluno.nome}
              <button
                type="button"
                aria-label={`Remover aluno ${aluno.nome}`}
                onClick={() => onRemoverAluno(aluno.id)}
              >
                x
              </button>
            </div>
          ))}
        </div>

        <fieldset className="checkbox-area">
          <legend>Tipos de ocorrência</legend>
          {tiposOcorrencia.map((tipo) => (
            <label className="checkbox-item" key={tipo}>
              <input
                type="checkbox"
                checked={ocorrenciasTipo.includes(tipo)}
                onChange={() => onCheckboxChange(tipo)}
              />
              <span>{tipo}</span>
            </label>
          ))}
        </fieldset>

        {ocorrenciasTipo.includes("Outro") && (
          <>
            <label className="campo-form" htmlFor="outro-tipo">
              Outro tipo
            </label>
            <input
              id="outro-tipo"
              value={outro}
              onChange={(event) => onOutroChange(event.target.value)}
              placeholder="Outro tipo"
            />
          </>
        )}

        <label className="campo-form" htmlFor="observacao">
          Observação
        </label>
        <textarea
          id="observacao"
          value={observacao}
          onChange={(event) => onObservacaoChange(event.target.value)}
          placeholder="Observação"
        />

        <button type="submit">Salvar</button>
        <button type="button" onClick={onVoltar}>
          Voltar
        </button>
      </form>
    </section>
  );
}

const alunoShape = PropTypes.shape({
  id: PropTypes.number.isRequired,
  nome: PropTypes.string.isRequired,
});

FormularioOcorrencia.propTypes = {
  alunoInput: PropTypes.string.isRequired,
  alunos: PropTypes.arrayOf(alunoShape).isRequired,
  disciplina: PropTypes.string.isRequired,
  disciplinas: PropTypes.arrayOf(PropTypes.string).isRequired,
  horario: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  horarios: PropTypes.arrayOf(PropTypes.number).isRequired,
  observacao: PropTypes.string.isRequired,
  ocorrenciasTipo: PropTypes.arrayOf(PropTypes.string).isRequired,
  outro: PropTypes.string.isRequired,
  turma: PropTypes.string.isRequired,
  turmas: PropTypes.arrayOf(PropTypes.string).isRequired,
  turno: PropTypes.string.isRequired,
  tiposOcorrencia: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAdicionarAluno: PropTypes.func.isRequired,
  onAlunoInputChange: PropTypes.func.isRequired,
  onCheckboxChange: PropTypes.func.isRequired,
  onDisciplinaChange: PropTypes.func.isRequired,
  onHorarioChange: PropTypes.func.isRequired,
  onObservacaoChange: PropTypes.func.isRequired,
  onOutroChange: PropTypes.func.isRequired,
  onRemoverAluno: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onTurmaChange: PropTypes.func.isRequired,
  onTurnoChange: PropTypes.func.isRequired,
  onVoltar: PropTypes.func.isRequired,
};

export default memo(FormularioOcorrencia);

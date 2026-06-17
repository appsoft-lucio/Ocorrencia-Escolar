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
      <div className="formulario-cabecalho">
        <div>
          <h2 id="titulo-form-ocorrencia">Nova ocorrência</h2>
          <p>Preencha os dados da aula e selecione os alunos envolvidos.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <fieldset className="formulario-grupo">
          <legend>Dados da aula</legend>

          <div className="formulario-grid">
            <label className="campo-form" htmlFor="turno">
              <span>Turno</span>
              <select
                id="turno"
                value={turno}
                onChange={(event) => onTurnoChange(event.target.value)}
                required
              >
                <option value="">Selecione</option>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </label>

            <label className="campo-form" htmlFor="turma">
              <span>Turma</span>
              <select
                id="turma"
                value={turma}
                onChange={(event) => onTurmaChange(event.target.value)}
                required
              >
                <option value="">Selecione</option>
                {turmas.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="campo-form" htmlFor="horario">
              <span>Horário</span>
              <select
                id="horario"
                value={horario}
                onChange={(event) => onHorarioChange(event.target.value)}
              >
                <option value="">Selecione</option>
                {horarios.map((item) => (
                  <option key={item} value={item}>
                    {item}º aula
                  </option>
                ))}
              </select>
            </label>

            <label className="campo-form" htmlFor="disciplina">
              <span>Disciplina</span>
              <select
                id="disciplina"
                value={disciplina}
                onChange={(event) => onDisciplinaChange(event.target.value)}
                required
              >
                <option value="">Selecione</option>
                {disciplinas.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="formulario-grupo">
          <legend>Alunos</legend>

          <label className="campo-form" htmlFor="aluno">
            <span>Nome do aluno</span>
            <div className="aluno-box">
              <input
                id="aluno"
                value={alunoInput}
                onChange={onAlunoInputChange}
                placeholder="Nome e sobrenome"
                aria-describedby="aluno-ajuda"
              />
              <button type="button" onClick={onAdicionarAluno}>
                Adicionar
              </button>
            </div>
          </label>

          <small id="aluno-ajuda" className="texto-ajuda">
            Informe nome e sobrenome, com no mínimo 2 letras em cada palavra.
          </small>

          <div className="lista-alunos" aria-live="polite">
            {alunos.length === 0 ? (
              <span className="lista-alunos-vazia">Nenhum aluno adicionado.</span>
            ) : (
              alunos.map((aluno) => (
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
              ))
            )}
          </div>
        </fieldset>

        <fieldset className="formulario-grupo checkbox-area">
          <legend>Tipos de ocorrência</legend>

          <div className="checkbox-grid">
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
          </div>
        </fieldset>

        {ocorrenciasTipo.includes("Outro") && (
          <label className="campo-form campo-outro-tipo" htmlFor="outro-tipo">
            <span>Outro tipo</span>
            <input
              id="outro-tipo"
              value={outro}
              onChange={(event) => onOutroChange(event.target.value)}
              placeholder="Descreva o tipo"
            />
          </label>
        )}

        <fieldset className="formulario-grupo">
          <legend>Observação</legend>

          <label className="campo-form" htmlFor="observacao">
            <span>Detalhes da ocorrência</span>
            <textarea
              id="observacao"
              value={observacao}
              onChange={(event) => onObservacaoChange(event.target.value)}
              placeholder="Descreva o que aconteceu"
            />
          </label>
        </fieldset>

        <div className="formulario-acoes">
          <button type="button" className="btn-voltar" onClick={onVoltar}>
            Voltar
          </button>
          <button type="submit" className="btn-salvar">
            Salvar ocorrência
          </button>
        </div>
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

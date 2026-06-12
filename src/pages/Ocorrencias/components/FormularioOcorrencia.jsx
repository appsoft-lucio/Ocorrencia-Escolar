import { memo } from "react";

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
    <div className="ocorrencias-form">
      <h2>Nova Ocorrência</h2>

      <form onSubmit={onSubmit}>
        <select value={turno} onChange={(event) => onTurnoChange(event.target.value)}>
          <option value="">Turno</option>
          <option value="manha">Manhã</option>
          <option value="tarde">Tarde</option>
          <option value="noite">Noite</option>
        </select>

        <select value={turma} onChange={(event) => onTurmaChange(event.target.value)}>
          <option value="">Turma</option>
          {turmas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
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

        <select
          value={disciplina}
          onChange={(event) => onDisciplinaChange(event.target.value)}
        >
          <option value="">Disciplina</option>
          {disciplinas.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <div className="aluno-box">
          <input
            value={alunoInput}
            onChange={onAlunoInputChange}
            placeholder="Aluno"
          />
          <button type="button" onClick={onAdicionarAluno}>
            Adicionar
          </button>
        </div>

        <div className="lista-alunos">
          {alunos.map((aluno) => (
            <div key={aluno.id}>
              {aluno.nome}
              <button type="button" onClick={() => onRemoverAluno(aluno.id)}>
                x
              </button>
            </div>
          ))}
        </div>

        <div className="checkbox-area">
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

        {ocorrenciasTipo.includes("Outro") && (
          <input
            value={outro}
            onChange={(event) => onOutroChange(event.target.value)}
            placeholder="Outro tipo"
          />
        )}

        <textarea
          value={observacao}
          onChange={(event) => onObservacaoChange(event.target.value)}
          placeholder="Observação"
        />

        <button type="submit">Salvar</button>
        <button type="button" onClick={onVoltar}>
          Voltar
        </button>
      </form>
    </div>
  );
}

export default memo(FormularioOcorrencia);

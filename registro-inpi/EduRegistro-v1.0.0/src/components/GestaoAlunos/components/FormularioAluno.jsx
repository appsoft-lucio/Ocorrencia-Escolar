import PropTypes from "prop-types";

const TURNOS = ["Manha", "Tarde", "Noite", "Integral"];

export default function FormularioAluno({ form, onCancelar, onChange, onSubmit, turmas }) {
  return (
    <form className="gestao-alunos-form" onSubmit={onSubmit}>
      <input
        value={form.nome}
        onChange={(event) => onChange({ ...form, nome: event.target.value })}
        placeholder="Nome completo"
      />
      <select
        value={form.turmaId}
        onChange={(event) => {
          const turma = turmas.find((item) => item.id === event.target.value);
          onChange({
            ...form,
            turmaId: event.target.value,
            turno: turma?.turno || form.turno,
          });
        }}
      >
        <option value="">Turma</option>
        {turmas
          .filter((turma) => turma.cadastrado && turma.status !== "inativo")
          .map((turma) => (
            <option key={turma.id} value={turma.id}>{turma.codigo}</option>
          ))}
      </select>
      <select
        value={form.turno}
        onChange={(event) => onChange({ ...form, turno: event.target.value })}
      >
        <option value="">Turno</option>
        {TURNOS.map((turno) => <option key={turno}>{turno}</option>)}
      </select>
      <button type="submit">
        {form.id ? "Atualizar/transferir" : "Cadastrar aluno"}
      </button>
      {form.id && <button type="button" onClick={onCancelar}>Cancelar</button>}
    </form>
  );
}

FormularioAluno.propTypes = {
  form: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string.isRequired,
    turmaId: PropTypes.string.isRequired,
    turno: PropTypes.string.isRequired,
  }).isRequired,
  onCancelar: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  turmas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    cadastrado: PropTypes.bool,
    codigo: PropTypes.string.isRequired,
    status: PropTypes.string,
    turno: PropTypes.string,
  })).isRequired,
};

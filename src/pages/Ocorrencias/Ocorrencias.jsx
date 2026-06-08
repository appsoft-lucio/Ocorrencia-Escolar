// =========================
// ESTILOS DA PÁGINA
// =========================
import "./Ocorrencias.css";

// =========================
// REACT HOOKS
// =========================
import { useContext, useState } from "react";

// =========================
// NAVEGAÇÃO ENTRE PÁGINAS
// =========================
import { useNavigate } from "react-router-dom";

// =========================
// CONTEXTO GLOBAL DE OCORRÊNCIAS
// =========================
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

function Ocorrencias() {
  // =========================
  // CONTEXTO (CRUD GLOBAL)
  // =========================
  const { ocorrencias, addOcorrencia, removeOcorrencia } =
    useContext(OcorrenciaContext);

  // =========================
  // NAVEGAÇÃO
  // =========================
  const navigate = useNavigate();

  // Voltar para dashboard
  function handleBack() {
    navigate("/dashboard");
  }

  // =========================
  // ESTADOS DO FORMULÁRIO
  // =========================
  const [turno, setTurno] = useState("");
  const [horario, setHorario] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [aluno, setAluno] = useState("");
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState([]);
  const [outro, setOutro] = useState("");
  const [observacao, setObservacao] = useState("");

  // =========================
  // DISCIPLINAS FIXAS
  // =========================
  const disciplinas = [
    "Português",
    "Matemática",
    "História",
    "Geografia",
    "Ciências",
    "Inglês",
    "Educação Física",
    "Artes",
  ];

  // =========================
  // TIPOS DE OCORRÊNCIA
  // =========================
  const tiposOcorrencia = [
    "Indisciplina",
    "Atraso",
    "Falta de material",
    "Desrespeito",
    "Briga",
    "Uso de celular",
    "Outro",
  ];

  // =========================
  // MARCAR / DESMARCAR CHECKBOX
  // =========================
  function handleCheckbox(tipo) {
    if (ocorrenciasTipo.includes(tipo)) {
      setOcorrenciasTipo(ocorrenciasTipo.filter((item) => item !== tipo));
    } else {
      setOcorrenciasTipo([...ocorrenciasTipo, tipo]);
    }
  }

  // =========================
  // SALVAR OCORRÊNCIA
  // =========================
  function handleSubmit(e) {
    e.preventDefault();

    // validação básica
    if (!aluno || !disciplina || !turno) return;

    const novaOcorrencia = {
      id: Date.now(),

      turno,
      horario,
      disciplina,
      aluno,

      // se marcou "Outro", inclui texto manual
      tipos: ocorrenciasTipo.includes("Outro")
        ? [...ocorrenciasTipo, outro]
        : ocorrenciasTipo,

      observacao,

      data: new Date().toLocaleString(),
    };

    // salva no contexto global
    addOcorrencia(novaOcorrencia);

    // limpa formulário
    setTurno("");
    setHorario("");
    setDisciplina("");
    setAluno("");
    setOcorrenciasTipo([]);
    setOutro("");
    setObservacao("");
  }

  return (
    <div className="ocorrencias-container">
      {/* =========================
          FORMULÁRIO
      ========================= */}
      <div className="ocorrencias-form">
        <h2>Nova Ocorrência</h2>

        <form onSubmit={handleSubmit}>
          {/* TURNO */}
          <select value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="">Turno</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </select>

          {/* HORÁRIO */}
          <select value={horario} onChange={(e) => setHorario(e.target.value)}>
            <option value="">Horário</option>
            <option value="1">1º</option>
            <option value="2">2º</option>
            <option value="3">3º</option>
            <option value="4">4º</option>
            <option value="5">5º</option>
            <option value="6">6º</option>
          </select>

          {/* DISCIPLINA */}
          <select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
          >
            <option value="">Disciplina</option>
            {disciplinas.map((d, i) => (
              <option key={i} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* ALUNO */}
          <input
            type="text"
            placeholder="Nome do aluno"
            value={aluno}
            onChange={(e) => setAluno(e.target.value)}
          />

          {/* TIPOS DE OCORRÊNCIA */}
          <div className="checkbox-area">
            {tiposOcorrencia.map((tipo, i) => (
              <label key={i} className="checkbox-item">
                {/* checkbox */}
                <input
                  type="checkbox"
                  checked={ocorrenciasTipo.includes(tipo)}
                  onChange={() => handleCheckbox(tipo)}
                />

                {/* texto */}
                <span>{tipo}</span>
              </label>
            ))}
          </div>

          {/* OUTRO TIPO */}
          {ocorrenciasTipo.includes("Outro") && (
            <input
              type="text"
              placeholder="Descreva outro tipo"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
            />
          )}

          {/* OBSERVAÇÃO */}
          <textarea
            placeholder="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          {/* BOTÕES */}
          <div className="btn-group">
            {/* salvar ocorrência */}
            <button type="submit">Salvar</button>

            {/* voltar sem salvar */}
            <button type="button" onClick={handleBack} className="btn-voltar">
              Voltar
            </button>
          </div>
        </form>
      </div>

      {/* =========================
          LISTA DE OCORRÊNCIAS
      ========================= */}
      <div className="ocorrencias-lista">
        {ocorrencias.map((item) => (
          <div key={item.id} className="card-ocorrencia">
            <h3>{item.aluno}</h3>

            <p>
              {item.disciplina} - {item.turno} - {item.horario}º aula
            </p>

            <small>{item.data}</small>

            <button onClick={() => removeOcorrencia(item.id)}>Excluir</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Ocorrencias;

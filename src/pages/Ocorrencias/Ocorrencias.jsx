// =========================
// ESTILOS
// =========================
import "./Ocorrencias.css";

// =========================
// REACT
// =========================
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// =========================
// CONTEXTOS
// =========================
import { AuthContext } from "../../context/AuthContext";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

function Ocorrencias() {
  // =========================
  // NAVEGAÇÃO
  // =========================
  const navigate = useNavigate();

  // =========================
  // USUÁRIO LOGADO
  // =========================
  const { user } = useContext(AuthContext);

  // =========================
  // CONTEXTO OCORRÊNCIAS
  // =========================
  const { ocorrencias, addOcorrencia, removeOcorrencia } =
    useContext(OcorrenciaContext);

  // =========================
  // ESTADOS FORMULÁRIO
  // =========================
  const [turno, setTurno] = useState("");
  const [horario, setHorario] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [aluno, setAluno] = useState("");
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState([]);
  const [outro, setOutro] = useState("");
  const [observacao, setObservacao] = useState("");

  // =========================
  // DADOS FIXOS
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
  // CHECKBOX
  // =========================
  function handleCheckbox(tipo) {
    if (ocorrenciasTipo.includes(tipo)) {
      setOcorrenciasTipo(ocorrenciasTipo.filter((t) => t !== tipo));
    } else {
      setOcorrenciasTipo([...ocorrenciasTipo, tipo]);
    }
  }

  // =========================
  // SALVAR OCORRÊNCIA
  // =========================
  function handleSubmit(e) {
    e.preventDefault();

    if (!aluno || !disciplina || !turno) {
      alert("Preencha os campos obrigatórios");
      return;
    }

    const novaOcorrencia = {
      id: Date.now(),

      professorId: user.id,
      professorNome: user.nome,

      turno,
      horario,
      disciplina,
      aluno,

      tipos: ocorrenciasTipo.includes("Outro")
        ? [...ocorrenciasTipo, outro]
        : ocorrenciasTipo,

      observacao,

      data: new Date().toLocaleString(),
    };

    addOcorrencia(novaOcorrencia);

    // =========================
    // LIMPA FORMULÁRIO
    // =========================
    setTurno("");
    setHorario("");
    setDisciplina("");
    setAluno("");
    setOcorrenciasTipo([]);
    setOutro("");
    setObservacao("");

    // =========================
    // FEEDBACK
    // =========================
    alert("Ocorrência salva com sucesso!");

    // =========================
    // TRANSIÇÃO SUAVE
    // =========================
    setTimeout(() => {
      navigate("/dashboard");
    }, 600);
  }

  // =========================
  // VOLTAR COM ALERTA
  // =========================
  function handleBack() {
    const confirmar = window.confirm(
      "Se voltar agora, os dados não salvos serão perdidos. Deseja continuar?",
    );

    if (confirmar) {
      navigate("/dashboard");
    }
  }

  return (
    <div className="ocorrencias-container">
      {/* =========================
          FORMULÁRIO
      ========================= */}
      <div className="ocorrencias-form">
        <h2>Nova Ocorrência</h2>

        <form onSubmit={handleSubmit}>
          <select value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="">Turno</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </select>

          <select value={horario} onChange={(e) => setHorario(e.target.value)}>
            <option value="">Horário</option>
            <option value="1">1º</option>
            <option value="2">2º</option>
            <option value="3">3º</option>
            <option value="4">4º</option>
            <option value="5">5º</option>
            <option value="6">6º</option>
          </select>

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

          <input
            type="text"
            placeholder="Nome do aluno"
            value={aluno}
            onChange={(e) => setAluno(e.target.value)}
          />

          <div className="checkbox-area">
            {tiposOcorrencia.map((tipo, i) => (
              <label key={i} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={ocorrenciasTipo.includes(tipo)}
                  onChange={() => handleCheckbox(tipo)}
                />

                <span>{tipo}</span>
              </label>
            ))}
          </div>

          {ocorrenciasTipo.includes("Outro") && (
            <input
              type="text"
              placeholder="Descreva outro tipo"
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
            />
          )}

          <textarea
            placeholder="Observação"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />

          {/* =========================
              BOTÕES
          ========================= */}
          <div className="btn-group">
            <button type="submit">Salvar</button>

            <button type="button" onClick={handleBack} className="btn-voltar">
              Voltar
            </button>
          </div>
        </form>
      </div>

      {/* =========================
          LISTA
      ========================= */}
      <div className="ocorrencias-lista">
        {ocorrencias
          .filter((item) => {
            if (user.role === "direcao") return true;
            return item.professorId === user.id;
          })
          .map((item) => (
            <div key={item.id} className="card-ocorrencia">
              <h3>{item.aluno}</h3>

              <p>
                {item.disciplina} - {item.turno} - {item.horario}º aula
              </p>

              <small>Criado por: {item.professorNome}</small>

              <br />

              <small>{item.data}</small>

              <button onClick={() => removeOcorrencia(item.id)}>Excluir</button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default Ocorrencias;

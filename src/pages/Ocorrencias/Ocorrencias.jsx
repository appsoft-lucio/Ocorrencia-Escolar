// =========================
// ESTILOS
// =========================
import "./Ocorrencias.css";

// =========================
// REACT
// =========================
import { useContext, useState } from "react";

// =========================
// NAVEGAÇÃO
// =========================
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
  // OCORRÊNCIAS GLOBAL
  // =========================
  const { ocorrencias, addOcorrencia, removeOcorrencia } =
    useContext(OcorrenciaContext);

  // =========================
  // FORMULÁRIO
  // =========================
  const [turno, setTurno] = useState("");
  const [horario, setHorario] = useState("");
  const [disciplina, setDisciplina] = useState("");

  // =========================
  // ALUNOS (MÚLTIPLOS)
  // =========================
  const [alunos, setAlunos] = useState([]);
  const [alunoInput, setAlunoInput] = useState("");

  // =========================
  // TIPOS DE OCORRÊNCIA
  // =========================
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState([]);
  const [outro, setOutro] = useState("");

  // =========================
  // OBSERVAÇÃO
  // =========================
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
  // ADICIONAR ALUNO
  // =========================
  function adicionarAluno() {
    if (!alunoInput.trim()) return;

    setAlunos([...alunos, alunoInput.trim()]);
    setAlunoInput("");
  }

  // =========================
  // REMOVER ALUNO
  // =========================
  function removerAluno(nome) {
    setAlunos(alunos.filter((a) => a !== nome));
  }

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

    if (alunos.length === 0 || !disciplina || !turno) {
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

      // múltiplos alunos
      alunos,

      tipos: ocorrenciasTipo.includes("Outro")
        ? [...ocorrenciasTipo, outro]
        : ocorrenciasTipo,

      observacao,

      data: new Date().toLocaleString(),

      status: "Aberta",
      resolvidoPor: null,
    };

    addOcorrencia(novaOcorrencia);

    // limpa formulário
    setTurno("");
    setHorario("");
    setDisciplina("");
    setAlunos([]);
    setAlunoInput("");
    setOcorrenciasTipo([]);
    setOutro("");
    setObservacao("");

    alert("Ocorrência salva com sucesso!");
  }

  // =========================
  // VOLTAR COM CONFIRMAÇÃO
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

          {/* =========================
              ALUNOS
          ========================= */}
          <div className="aluno-box">
            <input
              type="text"
              placeholder="Nome do aluno"
              value={alunoInput}
              onChange={(e) => setAlunoInput(e.target.value)}
            />

            <button type="button" onClick={adicionarAluno}>
              Adicionar
            </button>
          </div>

          {/* LISTA DE ALUNOS */}
          <div className="lista-alunos">
            {alunos.map((a, i) => (
              <div key={i} className="aluno-item">
                <span>{a}</span>
                <button type="button" onClick={() => removerAluno(a)}>
                  x
                </button>
              </div>
            ))}
          </div>

          {/* TIPOS */}
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

          {/* OUTRO */}
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
          LISTA (1 CARD POR ALUNO)
      ========================= */}
      {/* =========================
    LISTA (1 CARD POR ALUNO)
========================= */}
      <div className="ocorrencias-lista">
        {ocorrencias
          .filter((item) => {
            // direção vê tudo
            if (user.role === "direcao") return true;

            // professor vê só o dele
            return item.professorId === user.id;
          })
          .flatMap((item) =>
            item.alunos.map((aluno, index) => (
              <div key={`${item.id}-${index}`} className="card-ocorrencia">
                {/* =========================
              ALUNO
          ========================= */}
                <h3>{aluno}</h3>

                {/* =========================
              DADOS DA OCORRÊNCIA
          ========================= */}
                <p>
                  {item.disciplina} - {item.turno} - {item.horario}º aula
                </p>

                {/* =========================
              TIPO DA OCORRÊNCIA
          ========================= */}
                <p>
                  <strong>Tipo:</strong>{" "}
                  {item.tipos && item.tipos.length > 0
                    ? item.tipos.join(", ")
                    : "Não informado"}
                </p>

                {/* =========================
              OBSERVAÇÃO (OPCIONAL)
          ========================= */}
                {item.observacao && item.observacao.trim() !== "" && (
                  <p>
                    <strong>Observação:</strong> {item.observacao}
                  </p>
                )}

                {/* =========================
              PROFESSOR
          ========================= */}
                <small>Criado por: {item.professorNome}</small>

                <br />

                {/* =========================
              DATA
          ========================= */}
                <small>{item.data}</small>

                {/* =========================
              STATUS
          ========================= */}
                <p>
                  Status: <strong>{item.status}</strong>
                </p>

                {/* =========================
              BOTÃO EXCLUIR
          ========================= */}
                <button onClick={() => removeOcorrencia(item.id)}>
                  Excluir
                </button>
              </div>
            )),
          )}
      </div>
    </div>
  );
}

export default Ocorrencias;

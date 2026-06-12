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

// =========================
// CONSTANTES FIXAS (fora do componente)
// =========================
const TIPOS_OCORRENCIA = [
  "Indisciplina",
  "Atraso",
  "Falta de material",
  "Desrespeito",
  "Briga",
  "Uso de celular",
  "Outro",
];

const DISCIPLINAS = [
  "Português",
  "Matemática",
  "História",
  "Geografia",
  "Ciências",
  "Inglês",
  "Educação Física",
  "Artes",
];

const TURMAS = [
  "101",
  "102",
  "103",
  "201",
  "202",
  "203",
  "301",
  "302",
  "303",
  "401",
  "402",
  "403",
  "501",
  "502",
  "503",
  "601",
  "602",
  "603",
  "701",
  "702",
  "703",
  "801",
  "802",
  "803",
  "901",
  "902",
  "903",
  "1001",
  "1002",
  "1003",
  "2001",
  "2002",
  "2003",
  "3001",
  "3002",
  "3003",
];

function normalizarNomeAluno(valor) {
  return valor.trim().replace(/\s+/g, " ");
}

function nomeAlunoValido(nome) {
  const palavras = nome.split(" ");

  return (
    palavras.length >= 2 &&
    palavras.every((palavra) => palavra.replace(/[^\p{L}]/gu, "").length >= 2)
  );
}

function Ocorrencias() {
  // =========================
  // NAVEGAÇÃO
  // =========================
  const navigate = useNavigate();

  // =========================
  // USUÁRIO LOGADO
  // =========================
  const { user } = useContext(AuthContext);
  if (!user) return <div>Carregando...</div>;

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
  const [turma, setTurma] = useState("");

  // =========================
  // ALUNOS
  // =========================
  const [alunos, setAlunos] = useState([]); // agora armazenamos {id, nome}
  const [alunoInput, setAlunoInput] = useState("");

  // =========================
  // TIPOS OCORRÊNCIA
  // =========================
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState([]);
  const [outro, setOutro] = useState("");

  // =========================
  // OBSERVAÇÃO
  // =========================
  const [observacao, setObservacao] = useState("");

  // constantes fixas movidas para o topo do arquivo

  // =========================
  // ALUNO
  // =========================
  function adicionarAluno() {
    const nome = normalizarNomeAluno(alunoInput);
    if (!nome) return;
    if (!nomeAlunoValido(nome)) {
      alert("Informe nome e sobrenome, com no minimo 2 letras em cada palavra");
      return;
    }
    if (alunos.some((a) => a.nome.toLowerCase() === nome.toLowerCase())) {
      alert("Aluno já adicionado");
      return;
    }
    setAlunos([...alunos, { id: Date.now(), nome }]);
    setAlunoInput("");
  }

  function removerAluno(id) {
    setAlunos(alunos.filter((a) => a.id !== id));
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
  // SALVAR
  // =========================
  function handleSubmit(e) {
    e.preventDefault();

    if (!alunos.length || !disciplina || !turno || !turma) {
      alert("Preencha os campos obrigatórios");
      return;
    }
    const tiposSelecionados = ocorrenciasTipo.includes("Outro")
      ? [
          ...ocorrenciasTipo.filter((t) => t !== "Outro"),
          ...(outro.trim() ? [outro.trim()] : []),
        ]
      : ocorrenciasTipo;

    const novaOcorrencia = {
      id: Date.now(),

      professorId: user.id,
      professorNome: user.nome,

      turno,
      horario,
      disciplina,
      turma,

      alunos: alunos.map((a) => a.nome),

      tipos: tiposSelecionados,

      observacao,

      data: new Date().toLocaleString(),
      status: "Aberta",
      resolvidoPor: null,
    };

    addOcorrencia(novaOcorrencia);

    setTurno("");
    setTurma("");
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
  // VOLTAR
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
      {/* ========================= FORM ========================= */}
      <div className="ocorrencias-form">
        <h2>Nova Ocorrência</h2>

        <form onSubmit={handleSubmit}>
          <select value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="">Turno</option>
            <option value="manha">Manhã</option>
            <option value="tarde">Tarde</option>
            <option value="noite">Noite</option>
          </select>

          <select value={turma} onChange={(e) => setTurma(e.target.value)}>
            <option value="">Turma</option>
            {TURMAS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select value={horario} onChange={(e) => setHorario(e.target.value)}>
            <option value="">Horário</option>

            {[1, 2, 3, 4, 5, 6].map((hora) => (
              <option key={hora} value={hora}>
                {hora}º
              </option>
            ))}
          </select>

          <select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
          >
            <option value="">Disciplina</option>
            {DISCIPLINAS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* alunos */}
          <div className="aluno-box">
            <input
              value={alunoInput}
              onChange={(e) =>
                setAlunoInput(e.target.value.replace(/\s+/g, " "))
              }
              placeholder="Aluno"
            />
            <button type="button" onClick={adicionarAluno}>
              Adicionar
            </button>
          </div>

          <div className="lista-alunos">
            {alunos.map((a) => (
              <div key={a.id}>
                {a.nome}
                <button type="button" onClick={() => removerAluno(a.id)}>
                  x
                </button>
              </div>
            ))}
          </div>

          {/* tipos */}
          <div>
            {TIPOS_OCORRENCIA.map((t) => (
              <label key={t}>
                <input
                  type="checkbox"
                  checked={ocorrenciasTipo.includes(t)}
                  onChange={() => handleCheckbox(t)}
                />
                {t}
              </label>
            ))}
          </div>

          {ocorrenciasTipo.includes("Outro") && (
            <input
              value={outro}
              onChange={(e) => setOutro(e.target.value)}
              placeholder="Outro tipo"
            />
          )}

          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação"
          />

          <button type="submit">Salvar</button>
          <button type="button" onClick={handleBack}>
            Voltar
          </button>
        </form>
      </div>

      {/* ========================= LISTA ========================= */}
      <div className="ocorrencias-lista">
        {ocorrencias
          .filter(
            (item) => user.role === "direcao" || item.professorId === user.id,
          )
          .flatMap((item) =>
            item.alunos.map((aluno, index) => (
              <div key={`${item.id}-${index}`} className="card-ocorrencia">
                <h3>{aluno}</h3>

                <p>
                  <strong>Turma:</strong> {item.turma}
                </p>

                <p>
                  {item.disciplina} - {item.turno} - {item.horario}º aula
                </p>

                <p>
                  <strong>Tipos:</strong>{" "}
                  {item.tipos?.join(", ") || "Não informado"}
                </p>

                {item.observacao && (
                  <p>
                    <strong>Obs:</strong> {item.observacao}
                  </p>
                )}

                <small>{item.professorNome}</small>
                <br />
                <small>{item.data}</small>

                <p>
                  Status: <strong>{item.status}</strong>
                </p>

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

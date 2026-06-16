import "./professor.css";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import ProfessorCard from "../../components/Cards/professorCard/professorCard";
import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

function Professor() {
  const { user } = useContext(AuthContext);

  const [abrirModal, setAbrirModal] = useState(false);

  const [nome, setNome] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [turno, setTurno] = useState("Manhã");

  const [novaTurma, setNovaTurma] = useState("");
  const [turmas, setTurmas] = useState([]);

  const [professores, setProfessores] = useState([
    {
      nome: "João Silva",
      disciplina: "Matemática",
      turno: "Manhã",
      turmas: ["101", "102", "201"],
      ocorrencias: 18,
    },
    {
      nome: "Maria Souza",
      disciplina: "Português",
      turno: "Tarde",
      turmas: ["301", "302"],
      ocorrencias: 9,
    },
    {
      nome: "Carlos Oliveira",
      disciplina: "História",
      turno: "Manhã",
      turmas: ["401", "402"],
      ocorrencias: 5,
    },
    {
      nome: "Ana Paula",
      disciplina: "Ciências",
      turno: "Noite",
      turmas: ["1001", "1002"],
      ocorrencias: 12,
    },
  ]);

  const limparFormulario = () => {
    setNome("");
    setDisciplina("");
    setTurno("Manhã");
    setNovaTurma("");
    setTurmas([]);
  };

  const fecharModal = () => {
    limparFormulario();
    setAbrirModal(false);
  };

  const adicionarTurma = () => {
    const turma = novaTurma.trim();

    if (!turma) return;

    if (turmas.includes(turma)) {
      alert("Esta turma já foi adicionada.");
      return;
    }

    setTurmas((prev) => [...prev, turma]);
    setNovaTurma("");
  };

  const removerTurma = (index) => {
    setTurmas((prev) => prev.filter((_, i) => i !== index));
  };

  const salvarProfessor = () => {
    if (!nome.trim()) {
      alert("Informe o nome do professor.");
      return;
    }

    if (!disciplina.trim()) {
      alert("Informe a disciplina.");
      return;
    }

    const novoProfessor = {
      nome,
      disciplina,
      turno,
      turmas,
      ocorrencias: 0,
    };

    setProfessores((prev) => [...prev, novoProfessor]);

    fecharModal();
  };

  return (
    <div className="professores-layout">
      <Sidebar />

      <div className="professores-main">
        <Header />

        {abrirModal && (
          <div className="modal-overlay">
            <div className="modal-professor">
              <h2>Novo Professor</h2>

              <input
                type="text"
                placeholder="Nome do professor"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />

              <input
                type="text"
                placeholder="Disciplina"
                value={disciplina}
                onChange={(e) => setDisciplina(e.target.value)}
              />

              <select value={turno} onChange={(e) => setTurno(e.target.value)}>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
                <option value="Integral">Integral</option>
              </select>

              <div className="turmas-section">
                <h3>Turmas</h3>

                <div className="turma-adicionar">
                  <input
                    type="text"
                    placeholder="Ex: 101"
                    value={novaTurma}
                    onChange={(e) => setNovaTurma(e.target.value)}
                  />

                  <button
                    type="button"
                    className="btn-add-turma"
                    onClick={adicionarTurma}
                  >
                    +
                  </button>
                </div>

                <div className="lista-turmas">
                  {turmas.map((turma, index) => (
                    <div key={index} className="turma-item">
                      <span>{turma}</span>

                      <button type="button" onClick={() => removerTurma(index)}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-botoes">
                <button type="button" onClick={fecharModal}>
                  Cancelar
                </button>

                <button type="button" onClick={salvarProfessor}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="professores-content">
          <div className="professores-topo">
            <div>
              <h1>Professores</h1>
              <h2>Gerenciamento de professores e turmas</h2>
            </div>

            <button
              className="btn-novo-professor"
              onClick={() => setAbrirModal(true)}
            >
              + Novo Professor
            </button>
          </div>

          <p className="professores-descricao">
            Bem-vindo, <strong>{user.nome}</strong>. Nesta página é possível
            visualizar os professores cadastrados, as turmas em que lecionam, o
            turno de atuação e a quantidade de ocorrências registradas.
          </p>

          <section className="professores-cards">
            {professores.map((professor, index) => (
              <ProfessorCard
                key={`${professor.nome}-${index}`}
                nome={professor.nome}
                disciplina={professor.disciplina}
                turno={professor.turno}
                turmas={professor.turmas}
                ocorrencias={professor.ocorrencias}
              />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Professor;

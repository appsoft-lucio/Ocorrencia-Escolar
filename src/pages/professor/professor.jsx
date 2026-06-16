import "./professor.css";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import ProfessorCard from "../../components/Cards/professorCard/professorCard";
import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";

function Professor() {
  const { user } = useContext(AuthContext);

  // Estados do modal e formulário
  const [abrirModal, setAbrirModal] = useState(false);
  const [formData, setFormData] = useState({
    nome: "",
    disciplina: "",
    turno: "Manhã",
    novaTurma: "",
    turmas: [],
  });
  const [mensagem, setMensagem] = useState("");

  // Estados dos dados
  const [professores, setProfessores] = useState(() => {
    const stored = localStorage.getItem("professores");
    return stored
      ? JSON.parse(stored)
      : [
          {
            id: 1,
            nome: "João Silva",
            disciplina: "Matemática",
            turno: "Manhã",
            turmas: ["101", "102", "201"],
            ocorrencias: 18,
          },
          {
            id: 2,
            nome: "Maria Souza",
            disciplina: "Português",
            turno: "Tarde",
            turmas: ["301", "302"],
            ocorrencias: 9,
          },
          {
            id: 3,
            nome: "Carlos Oliveira",
            disciplina: "História",
            turno: "Manhã",
            turmas: ["401", "402"],
            ocorrencias: 5,
          },
          {
            id: 4,
            nome: "Ana Paula",
            disciplina: "Ciências",
            turno: "Noite",
            turmas: ["1001", "1002"],
            ocorrencias: 12,
          },
        ];
  });

  // Salvar no localStorage sempre que professores mudam
  useEffect(() => {
    localStorage.setItem("professores", JSON.stringify(professores));
  }, [professores]);

  const limparFormulario = () => {
    setFormData({
      nome: "",
      disciplina: "",
      turno: "Manhã",
      novaTurma: "",
      turmas: [],
    });
    setMensagem("");
  };

  const fecharModal = () => {
    limparFormulario();
    setAbrirModal(false);
  };

  const adicionarTurma = () => {
    const turma = formData.novaTurma.trim();

    if (!turma) {
      setMensagem("Digite o código da turma.");
      return;
    }

    if (formData.turmas.includes(turma)) {
      setMensagem("Esta turma já foi adicionada.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      turmas: [...prev.turmas, turma],
      novaTurma: "",
    }));
    setMensagem("");
  };

  const removerTurma = (turmaRemover) => {
    setFormData((prev) => ({
      ...prev,
      turmas: prev.turmas.filter((turma) => turma !== turmaRemover),
    }));
  };

  const salvarProfessor = () => {
    if (!formData.nome.trim()) {
      setMensagem("Informe o nome do professor.");
      return;
    }

    if (!formData.disciplina.trim()) {
      setMensagem("Informe a disciplina.");
      return;
    }

    if (formData.turmas.length === 0) {
      setMensagem("Adicione pelo menos uma turma.");
      return;
    }

    const novoProfessor = {
      id: Date.now(), // ID único baseado em timestamp
      nome: formData.nome,
      disciplina: formData.disciplina,
      turno: formData.turno,
      turmas: formData.turmas,
      ocorrencias: 0,
    };

    setProfessores((prev) => [...prev, novoProfessor]);
    setMensagem("Professor adicionado com sucesso!");

    setTimeout(() => {
      fecharModal();
    }, 1000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMensagem("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      adicionarTurma();
    }
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

              {mensagem && (
                <div
                  className={`mensagem ${
                    mensagem.includes("sucesso") ? "sucesso" : "erro"
                  }`}
                >
                  {mensagem}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nome">Nome do Professor</label>
                <input
                  id="nome"
                  type="text"
                  name="nome"
                  placeholder="Ex: João Silva"
                  value={formData.nome}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="disciplina">Disciplina</label>
                <input
                  id="disciplina"
                  type="text"
                  name="disciplina"
                  placeholder="Ex: Matemática"
                  value={formData.disciplina}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="turno">Turno</label>
                <select
                  id="turno"
                  name="turno"
                  value={formData.turno}
                  onChange={handleInputChange}
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>

              <div className="turmas-section">
                <h3>Turmas</h3>

                <div className="turma-adicionar">
                  <input
                    type="text"
                    name="novaTurma"
                    placeholder="Ex: 101"
                    value={formData.novaTurma}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    aria-label="Código da turma"
                  />

                  <button
                    type="button"
                    className="btn-add-turma"
                    onClick={adicionarTurma}
                    title="Adicionar turma"
                  >
                    +
                  </button>
                </div>

                <div className="lista-turmas">
                  {formData.turmas.length > 0 ? (
                    formData.turmas.map((turma) => (
                      <div key={turma} className="turma-item">
                        <span>{turma}</span>
                        <button
                          type="button"
                          onClick={() => removerTurma(turma)}
                          title="Remover turma"
                          aria-label={`Remover turma ${turma}`}
                        >
                          ×
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="vazio">Nenhuma turma adicionada</p>
                  )}
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
            {professores.length > 0 ? (
              professores.map((professor) => (
                <ProfessorCard
                  key={professor.id}
                  nome={professor.nome}
                  disciplina={professor.disciplina}
                  turno={professor.turno}
                  turmas={professor.turmas}
                  ocorrencias={professor.ocorrencias}
                />
              ))
            ) : (
              <p className="sem-dados">Nenhum professor cadastrado.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Professor;

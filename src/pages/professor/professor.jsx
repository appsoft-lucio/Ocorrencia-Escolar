import "./professor.css";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import ProfessorCard from "../../components/Cards/professorCard/professorCard.jsx";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";

function Professor() {
  const { user } = useContext(AuthContext);

  const professores = [
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
  ];

  return (
    <div className="professores-layout">
      <Sidebar />
      <div className="professores-main">
        <Header />
        <main className="professores-content">
          <h1>Professores</h1>
          <h2>Gerenciamento de professores e turmas</h2>

          <p className="professores-descricao">
            Bem-vindo, <strong>{user.nome}</strong>. Nesta página é possível
            visualizar os professores cadastrados, as turmas em que lecionam, o
            turno de atuação e a quantidade de ocorrências registradas.
          </p>

          <section className="professores-cards">
            {professores.map((professor) => (
              <ProfessorCard
                key={professor.nome}
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

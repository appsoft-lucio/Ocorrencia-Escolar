import "./coordenador.css";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useEffect, useState } from "react";

function Coordenador() {
  const [coordenadores, setCoordenadores] = useState(() => {
    const stored = localStorage.getItem("coordenadores");
    return stored ? JSON.parse(stored) : [];
  });

  const [nome, setNome] = useState("");
  const [principal, setPrincipal] = useState(coordenadores.length === 0);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    localStorage.setItem("coordenadores", JSON.stringify(coordenadores));
  }, [coordenadores]);

  const adicionar = () => {
    if (!nome.trim()) {
      setMensagem("Informe o nome do coordenador.");
      return;
    }

    const novo = {
      id: Date.now(),
      nome: nome.trim(),
      principal: !!principal,
    };

    // se marcar principal, remover marca dos outros
    const updated = principal
      ? coordenadores.map((c) => ({ ...c, principal: false })).concat(novo)
      : coordenadores.concat(novo);

    setCoordenadores(updated);
    setNome("");
    setPrincipal(false);
    setMensagem("Coordenador adicionado com sucesso!");
    setTimeout(() => setMensagem(""), 2000);
  };

  const remover = (id) => {
    if (!window.confirm("Remover este coordenador?")) return;
    setCoordenadores((prev) => prev.filter((c) => c.id !== id));
  };

  const tornarPrincipal = (id) => {
    setCoordenadores((prev) =>
      prev.map((c) => ({ ...c, principal: c.id === id })),
    );
  };

  return (
    <div className="coordenador-layout">
      <Sidebar />
      <div className="coordenador-main">
        <Header />

        <main className="coordenador-content">
          <h1>Adicinar Coordenadores</h1>

          <section className="coordenador-form">
            {mensagem && <div className="mensagem">{mensagem}</div>}

            <label>Nome</label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Silva"
            />

            <div className="botoes">
              <button onClick={adicionar}>Adicionar</button>
            </div>
          </section>
          <h2>Coordenadores</h2>
          <section className="coordenador-lista">
            {coordenadores.length === 0 ? (
              <p>Nenhum coordenador cadastrado.</p>
            ) : (
              <ul>
                {coordenadores.map((c) => (
                  <li key={c.id} className={c.principal ? "principal" : ""}>
                    <span>{c.nome}</span>
                    <div className="acoes">
                      {!c.principal && (
                        <button onClick={() => tornarPrincipal(c.id)}>
                          Tornar principal
                        </button>
                      )}
                      <button onClick={() => remover(c.id)}>Remover</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Coordenador;

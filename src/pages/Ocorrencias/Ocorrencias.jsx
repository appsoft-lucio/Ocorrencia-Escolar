// Importa estilos da página
import "./Ocorrencias.css";

// Importa hooks do React
import { useContext, useState } from "react";

// Importa contexto de ocorrências
import { OcorrenciaContext } from "../../context/OcorrenciaContext";

// Página de Ocorrências
function Ocorrencias() {
  // Acessa dados do contexto
  const { ocorrencias, addOcorrencia, removeOcorrencia } =
    useContext(OcorrenciaContext);

  // Estado do formulário
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");

  // Função para salvar ocorrência
  function handleSubmit(e) {
    e.preventDefault();

    // Evita envio vazio
    if (!titulo.trim() || !descricao.trim()) return;

    // Cria nova ocorrência
    const novaOcorrencia = {
      id: Date.now(),
      titulo,
      descricao,
      data: new Date().toLocaleString(),
    };

    // Adiciona no contexto
    addOcorrencia(novaOcorrencia);

    // Limpa formulário
    setTitulo("");
    setDescricao("");
  }

  return (
    <div className="ocorrencias-container">
      {/* =========================
          FORMULÁRIO
      ========================= */}
      <div className="ocorrencias-form">
        <h2>Nova Ocorrência</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Título da ocorrência"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <textarea
            placeholder="Descrição"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <button type="submit">Salvar</button>
        </form>
      </div>

      {/* =========================
          LISTA DE OCORRÊNCIAS
      ========================= */}
      <div className="ocorrencias-lista">
        <h2>Ocorrências Registradas</h2>

        {ocorrencias.length === 0 ? (
          <p>Nenhuma ocorrência cadastrada</p>
        ) : (
          ocorrencias.map((item) => (
            <div key={item.id} className="card-ocorrencia">
              <h3>{item.titulo}</h3>

              <p>{item.descricao}</p>

              <small>{item.data}</small>

              <button onClick={() => removeOcorrencia(item.id)}>Excluir</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Ocorrencias;

// Importa estilos do card
import "./Card.css";

// Componente reutilizável de card de estatísticas
// Recebe dados via props (title, value, icon)
function StatsCard({ title, value, icon }) {
  return (
    // Container principal do card
    <div className="card">
      {/* Ícone do card (lado esquerdo) */}
      <div className="card-icon">{icon}</div>

      {/* Informações do card (lado direito) */}
      <div className="card-info">
        {/* Valor principal (ex: 120 alunos) */}
        <h3>{value}</h3>

        {/* Descrição do indicador */}
        <p>{title}</p>
      </div>
    </div>
  );
}

// Exporta o componente para reutilização
export default StatsCard;

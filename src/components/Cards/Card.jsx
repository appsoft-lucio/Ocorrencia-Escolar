import PropTypes from "prop-types";
import "./Card.css";

function StatsCard({ title, value, icon }) {
  return (
    <div className="card">
      <div className="card-icon">{icon}</div>

      <div className="card-info">
        <h3>{value}</h3>
        <p>{title}</p>
      </div>
    </div>
  );
}

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.node,
};

export default StatsCard;

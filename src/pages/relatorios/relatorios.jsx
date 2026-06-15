import "./relatorios.css";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

function Relatorios() {
  return (
    <div className="relatorios-layout">
      <Sidebar />
      <div className="relatorios-main">
        <Header />
        <h1>Relatórios</h1>
      </div>
    </div>
  );
}

export default Relatorios;

import "./configuracao.css";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

function Configuracao() {
  return (
    <div className="configuracao-layout">
      <Sidebar />
      <div className="configuracao-main">
        <Header />
        <h1>Configurações</h1>
      </div>
    </div>
  );
}

export default Configuracao;

import "./relatorios.css";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";

function Relatorios() {
  const { user } = useContext(AuthContext);

  return (
    <div className="relatorios-layout">
      <Sidebar />
      <div className="relatorios-main">
        <Header />
        <h1>Relatórios</h1>
        <h2>Bem-vindo, {user.nome}!</h2>
      </div>
    </div>
  );
}

export default Relatorios;

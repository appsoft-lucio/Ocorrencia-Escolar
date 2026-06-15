import "./professor.css";

import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";

function Professor() {
  return (
    <div className="professores-layout">
      <Sidebar />
      <div className="professores-main">
        <Header />
        <h1>Professor</h1>
      </div>
    </div>
  );
}

export default Professor;

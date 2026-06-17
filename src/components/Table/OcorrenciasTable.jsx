function OcorrenciasTable() {
  const dados = [
    { data: "10/06", aluno: "João", tipo: "Indisciplina", status: "Pendente" },
    { data: "09/06", aluno: "Maria", tipo: "Atraso", status: "Confirmada" },
    {
      data: "08/06",
      aluno: "Pedro",
      tipo: "Advertência",
      status: "Não confirmada",
    },
    {
      data: "07/06",
      aluno: "Ana",
      tipo: "Registro duplicado",
      status: "Cancelada",
    },
  ];

  return (
    <div className="table-container">
      <h3>Últimas Ocorrências</h3>

      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Aluno</th>
            <th>Tipo</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {dados.map((item, index) => (
            <tr key={index}>
              <td>{item.data}</td>
              <td>{item.aluno}</td>
              <td>{item.tipo}</td>
              <td>{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OcorrenciasTable;

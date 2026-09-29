import PropTypes from "prop-types";

export default function ConfirmacaoTransferencia({
  confirmacao,
  dialogoRef,
  importando,
  onAlternarAluno,
  onCancelar,
  onConfirmarCadastro,
  onConfirmarImportacao,
  onLimparSelecao,
  onSelecionarTodos,
  turmas,
}) {
  if (!confirmacao) return null;

  const cadastro = confirmacao.tipo === "cadastro";

  return (
    <div className="confirmacao-aluno-fundo">
      <section
        ref={dialogoRef}
        className="confirmacao-aluno"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmacao-aluno-titulo"
        aria-describedby="confirmacao-aluno-descricao"
        tabIndex="-1"
      >
        <h2 id="confirmacao-aluno-titulo">
          {cadastro ? "Aluno ja cadastrado" : "Alunos encontrados em outras turmas"}
        </h2>

        {cadastro ? (
          <div id="confirmacao-aluno-descricao">
            <p><strong>{confirmacao.aluno.nome}</strong></p>
            <p>
              Turma atual: <strong>{confirmacao.turmaAtual}</strong><br />
              Nova turma: <strong>{confirmacao.turmaDestino}</strong>
            </p>
            <p>Escolha se deseja manter ou transferir este aluno.</p>
          </div>
        ) : (
          <div id="confirmacao-aluno-descricao">
            <p>Os alunos abaixo ja estao cadastrados em outras turmas:</p>
            <div className="confirmacao-aluno-selecao-acoes">
              <button type="button" onClick={onSelecionarTodos}>Selecionar todos</button>
              <button type="button" onClick={onLimparSelecao}>Limpar selecao</button>
            </div>
            <ul className="confirmacao-aluno-lista">
              {confirmacao.duplicados.map((aluno) => {
                const turmaAtual = turmas.find((item) => item.id === aluno.turmaId);
                return (
                  <li key={aluno.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={confirmacao.selecionados.includes(aluno.id)}
                        onChange={() => onAlternarAluno(aluno.id)}
                      />
                      <span>
                        <strong>{aluno.nome}</strong>
                        <small>{turmaAtual?.codigo || "Turma atual"}</small>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <p>
              Somente os alunos marcados serao transferidos para <strong>{confirmacao.turmaDestino}</strong>.
              Os desmarcados permanecerao na turma atual. Os alunos novos serao cadastrados normalmente.
            </p>
          </div>
        )}

        <div className="confirmacao-aluno-acoes">
          <button
            type="button"
            className="btn-confirmacao-cancelar"
            onClick={onCancelar}
            disabled={importando}
          >
            {cadastro ? "Manter na turma atual" : "Cancelar importacao"}
          </button>
          <button
            type="button"
            className="btn-confirmacao-transferir"
            onClick={cadastro ? onConfirmarCadastro : onConfirmarImportacao}
            disabled={importando}
          >
            {importando
              ? "Processando..."
              : cadastro
                ? "Transferir aluno"
                : confirmacao.selecionados.length > 0
                  ? `Importar e transferir ${confirmacao.selecionados.length} selecionado(s)`
                  : "Importar novos sem transferir"}
          </button>
        </div>
      </section>
    </div>
  );
}

const alunoShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  nome: PropTypes.string.isRequired,
  turmaId: PropTypes.string,
});

ConfirmacaoTransferencia.propTypes = {
  confirmacao: PropTypes.shape({
    tipo: PropTypes.oneOf(["cadastro", "importacao"]).isRequired,
    aluno: alunoShape,
    duplicados: PropTypes.arrayOf(alunoShape),
    selecionados: PropTypes.arrayOf(PropTypes.string),
    turmaAtual: PropTypes.string,
    turmaDestino: PropTypes.string,
  }),
  dialogoRef: PropTypes.shape({ current: PropTypes.object }).isRequired,
  importando: PropTypes.bool.isRequired,
  onAlternarAluno: PropTypes.func.isRequired,
  onCancelar: PropTypes.func.isRequired,
  onConfirmarCadastro: PropTypes.func.isRequired,
  onConfirmarImportacao: PropTypes.func.isRequired,
  onLimparSelecao: PropTypes.func.isRequired,
  onSelecionarTodos: PropTypes.func.isRequired,
  turmas: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    codigo: PropTypes.string.isRequired,
  })).isRequired,
};

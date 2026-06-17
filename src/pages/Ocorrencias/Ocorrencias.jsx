import "./Ocorrencias.css";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../context/AuthContext";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";
import FormularioOcorrencia from "./components/FormularioOcorrencia";
import ListaOcorrencias from "./components/ListaOcorrencias";

const TIPOS_OCORRENCIA_PADRAO = [
  "Indisciplina",
  "Atraso",
  "Falta de material",
  "Desrespeito",
  "Briga",
  "Uso de celular",
  "Outro",
];

function carregarTiposOcorrencia() {
  const stored = localStorage.getItem("tiposOcorrencia");

  if (!stored) {
    return TIPOS_OCORRENCIA_PADRAO.map((nome) => ({
      id: nome,
      nome,
      status: "ativo",
    }));
  }

  try {
    const tipos = JSON.parse(stored);

    return tipos.map((tipo) =>
      typeof tipo === "string"
        ? { id: tipo, nome: tipo, status: "ativo" }
        : {
            ...tipo,
            id: tipo.id || tipo.nome,
            nome: tipo.nome,
            status: tipo.status || "ativo",
          },
    );
  } catch (error) {
    console.error("Erro ao carregar tipos de ocorrência:", error);
    return TIPOS_OCORRENCIA_PADRAO.map((nome) => ({
      id: nome,
      nome,
      status: "ativo",
    }));
  }
}

const DISCIPLINAS = [
  "Português",
  "Matemática",
  "História",
  "Geografia",
  "Ciências",
  "Inglês",
  "Educação Física",
  "Artes",
];

const TURMAS_PADRAO = [
  "101",
  "102",
  "103",
  "201",
  "202",
  "203",
  "301",
  "302",
  "303",
  "401",
  "402",
  "403",
  "501",
  "502",
  "503",
  "601",
  "602",
  "603",
  "701",
  "702",
  "703",
  "801",
  "802",
  "803",
  "901",
  "902",
  "903",
  "1001",
  "1002",
  "1003",
  "2001",
  "2002",
  "2003",
  "3001",
  "3002",
  "3003",
];

function carregarTurmasEscolares() {
  const stored = localStorage.getItem("turmasEscolares");

  if (!stored) {
    return TURMAS_PADRAO.map((nome) => ({
      id: nome,
      nome,
      status: "ativo",
    }));
  }

  try {
    const turmas = JSON.parse(stored);

    return turmas.map((turma) =>
      typeof turma === "string"
        ? { id: turma, nome: turma, status: "ativo" }
        : {
            ...turma,
            id: turma.id || turma.nome || turma.codigo,
            nome: turma.nome || turma.codigo,
            status: turma.status || "ativo",
          },
    );
  } catch (error) {
    console.error("Erro ao carregar turmas:", error);
    return TURMAS_PADRAO.map((nome) => ({
      id: nome,
      nome,
      status: "ativo",
    }));
  }
}

const HORARIOS = [1, 2, 3, 4, 5, 6];

const FILTROS_INICIAIS = {
  data: "",
  nome: "",
  professor: "",
  tipos: [],
  turno: "",
};

function normalizarNomeAluno(valor) {
  return valor.trim().replace(/\s+/g, " ");
}

function normalizarTexto(valor = "") {
  return valor
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function dataOcorrenciaParaISO(data) {
  if (!data) return "";

  const [dataParte] = data.split(",");
  const partes = dataParte.trim().split(/[/-]/);

  if (partes.length !== 3) return "";

  const [primeiro, segundo, terceiro] = partes;

  if (primeiro.length === 4) {
    return `${primeiro}-${segundo.padStart(2, "0")}-${terceiro.padStart(2, "0")}`;
  }

  return `${terceiro}-${segundo.padStart(2, "0")}-${primeiro.padStart(2, "0")}`;
}

function nomeAlunoValido(nome) {
  const palavras = nome.split(" ");

  return (
    palavras.length >= 2 &&
    palavras.every((palavra) => palavra.replace(/[^\p{L}]/gu, "").length >= 2)
  );
}

function Ocorrencias() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { ocorrencias, addOcorrencia, removeOcorrencia } =
    useContext(OcorrenciaContext);

  const [turno, setTurno] = useState("");
  const [horario, setHorario] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [turma, setTurma] = useState("");
  const [alunos, setAlunos] = useState([]);
  const [alunoInput, setAlunoInput] = useState("");
  const [ocorrenciasTipo, setOcorrenciasTipo] = useState([]);
  const [outro, setOutro] = useState("");
  const [observacao, setObservacao] = useState("");
  const [notificacao, setNotificacao] = useState(null);
  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [tiposOcorrencia, setTiposOcorrencia] = useState(carregarTiposOcorrencia);
  const [turmasEscolares, setTurmasEscolares] = useState(carregarTurmasEscolares);
  const notificacaoTimerRef = useRef(null);

  const mostrarNotificacao = useCallback((mensagem, tipo = "info") => {
    if (notificacaoTimerRef.current) {
      window.clearTimeout(notificacaoTimerRef.current);
    }

    setNotificacao({ mensagem, tipo });
    notificacaoTimerRef.current = window.setTimeout(() => {
      setNotificacao(null);
      notificacaoTimerRef.current = null;
    }, 3500);
  }, []);

  useEffect(() => {
    return () => {
      if (notificacaoTimerRef.current) {
        window.clearTimeout(notificacaoTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const atualizarCadastros = () => {
      setTiposOcorrencia(carregarTiposOcorrencia());
      setTurmasEscolares(carregarTurmasEscolares());
    };

    window.addEventListener("storage", atualizarCadastros);
    window.addEventListener("focus", atualizarCadastros);

    return () => {
      window.removeEventListener("storage", atualizarCadastros);
      window.removeEventListener("focus", atualizarCadastros);
    };
  }, []);

  const tiposOcorrenciaAtivos = useMemo(
    () =>
      tiposOcorrencia
        .filter((tipo) => tipo.status !== "inativo")
        .map((tipo) => tipo.nome),
    [tiposOcorrencia],
  );

  const turmasAtivas = useMemo(
    () =>
      turmasEscolares
        .filter((turma) => turma.status !== "inativo")
        .map((turma) => turma.nome),
    [turmasEscolares],
  );

  const limparFormulario = useCallback(() => {
    setTurno("");
    setTurma("");
    setHorario("");
    setDisciplina("");
    setAlunos([]);
    setAlunoInput("");
    setOcorrenciasTipo([]);
    setOutro("");
    setObservacao("");
  }, []);

  const handleAlunoInputChange = useCallback((event) => {
    setAlunoInput(event.target.value.replace(/\s+/g, " "));
  }, []);

  const adicionarAluno = useCallback(() => {
    const nome = normalizarNomeAluno(alunoInput);

    if (!nome) return;

    if (!nomeAlunoValido(nome)) {
      mostrarNotificacao(
        "Informe nome e sobrenome, com no mínimo 2 letras em cada palavra.",
        "erro",
      );
      return;
    }

    if (alunos.some((aluno) => aluno.nome.toLowerCase() === nome.toLowerCase())) {
      mostrarNotificacao("Aluno já adicionado.", "erro");
      return;
    }

    setAlunos((alunosAtuais) => [...alunosAtuais, { id: Date.now(), nome }]);
    setAlunoInput("");
  }, [alunoInput, alunos, mostrarNotificacao]);

  const removerAluno = useCallback((id) => {
    setAlunos((alunosAtuais) => alunosAtuais.filter((aluno) => aluno.id !== id));
  }, []);

  const handleCheckbox = useCallback((tipo) => {
    setOcorrenciasTipo((tiposAtuais) =>
      tiposAtuais.includes(tipo)
        ? tiposAtuais.filter((item) => item !== tipo)
        : [...tiposAtuais, tipo],
    );
  }, []);

  const tiposSelecionados = useMemo(() => {
    if (!ocorrenciasTipo.includes("Outro")) return ocorrenciasTipo;

    return [
      ...ocorrenciasTipo.filter((tipo) => tipo !== "Outro"),
      ...(outro.trim() ? [outro.trim()] : []),
    ];
  }, [ocorrenciasTipo, outro]);

  const ocorrenciasVisiveis = useMemo(() => {
    if (!user) return [];

    return ocorrencias.filter(
      (item) => user.role === "direcao" || item.professorId === user.id,
    );
  }, [ocorrencias, user]);

  const professoresDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(
          ocorrenciasVisiveis
            .map((ocorrencia) => ocorrencia.professorNome)
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b)),
    [ocorrenciasVisiveis],
  );

  const tiposDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(ocorrenciasVisiveis.flatMap((ocorrencia) => ocorrencia.tipos || [])),
      ).sort((a, b) => a.localeCompare(b)),
    [ocorrenciasVisiveis],
  );

  const ocorrenciasFiltradas = useMemo(() => {
    const nomeFiltro = normalizarTexto(filtros.nome);
    const professorFiltro = normalizarTexto(filtros.professor);

    return ocorrenciasVisiveis.filter((ocorrencia) => {
      const alunos = ocorrencia.alunos || [];
      const tipos = ocorrencia.tipos || [];

      const combinaNome =
        !nomeFiltro ||
        alunos.some((aluno) => normalizarTexto(aluno).includes(nomeFiltro));

      const combinaData =
        !filtros.data || dataOcorrenciaParaISO(ocorrencia.data) === filtros.data;

      const combinaTurno = !filtros.turno || ocorrencia.turno === filtros.turno;

      const combinaProfessor =
        !professorFiltro ||
        normalizarTexto(ocorrencia.professorNome).includes(professorFiltro);

      const combinaTipos =
        filtros.tipos.length === 0 ||
        filtros.tipos.some((tipo) => tipos.includes(tipo));

      return (
        combinaNome &&
        combinaData &&
        combinaTurno &&
        combinaProfessor &&
        combinaTipos
      );
    });
  }, [filtros, ocorrenciasVisiveis]);

  const filtrosAtivos = useMemo(
    () =>
      Boolean(
        filtros.nome ||
          filtros.data ||
          filtros.turno ||
          filtros.professor ||
          filtros.tipos.length,
      ),
    [filtros],
  );

  const atualizarFiltro = useCallback((campo, valor) => {
    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      [campo]: valor,
    }));
  }, []);

  const alternarFiltroTipo = useCallback((tipo) => {
    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      tipos: filtrosAtuais.tipos.includes(tipo)
        ? filtrosAtuais.tipos.filter((item) => item !== tipo)
        : [...filtrosAtuais.tipos, tipo],
    }));
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltros(FILTROS_INICIAIS);
  }, []);

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();

      if (!user) {
        mostrarNotificacao("Usuário não encontrado. Faça login novamente.", "erro");
        return;
      }

      if (!alunos.length || !disciplina || !turno || !turma) {
        mostrarNotificacao("Preencha os campos obrigatórios.", "erro");
        return;
      }

      try {
        addOcorrencia({
          id: Date.now(),
          professorId: user.id,
          professorNome: user.nome,
          turno,
          horario,
          disciplina,
          turma,
          alunos: alunos.map((aluno) => aluno.nome),
          tipos: tiposSelecionados,
          observacao,
          data: new Date().toLocaleString(),
          status: "Aberta",
          resolvidoPor: null,
        });

        limparFormulario();
        mostrarNotificacao("Ocorrência salva com sucesso.", "sucesso");
      } catch (error) {
        console.error("Erro ao salvar ocorrência:", error);
        mostrarNotificacao("Não foi possível salvar a ocorrência.", "erro");
      }
    },
    [
      addOcorrencia,
      alunos,
      disciplina,
      horario,
      limparFormulario,
      mostrarNotificacao,
      observacao,
      tiposSelecionados,
      turma,
      turno,
      user,
    ],
  );

  const handleBack = useCallback(() => {
    const confirmar = window.confirm(
      "Se voltar agora, os dados não salvos serão perdidos. Deseja continuar?",
    );

    if (confirmar) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleRemoveOcorrencia = useCallback(
    (id, aluno) => {
      const confirmar = window.confirm(
        `Deseja realmente excluir a ocorrência de ${aluno}?`,
      );

      if (!confirmar) return;

      try {
        removeOcorrencia(id, aluno);
        mostrarNotificacao("Ocorrência excluída.", "sucesso");
      } catch (error) {
        console.error("Erro ao excluir ocorrência:", error);
        mostrarNotificacao("Não foi possível excluir a ocorrência.", "erro");
      }
    },
    [mostrarNotificacao, removeOcorrencia],
  );

  if (!user) {
    return <div className="ocorrencias-feedback">Carregando usuário...</div>;
  }

  return (
    <div className="ocorrencias-container">
      {notificacao && (
        <div className={`notificacao notificacao-${notificacao.tipo}`} role="status">
          {notificacao.mensagem}
        </div>
      )}

      <FormularioOcorrencia
        alunoInput={alunoInput}
        alunos={alunos}
        disciplina={disciplina}
        disciplinas={DISCIPLINAS}
        horario={horario}
        horarios={HORARIOS}
        observacao={observacao}
        ocorrenciasTipo={ocorrenciasTipo}
        outro={outro}
        turma={turma}
        turmas={turmasAtivas}
        turno={turno}
        tiposOcorrencia={tiposOcorrenciaAtivos}
        onAdicionarAluno={adicionarAluno}
        onAlunoInputChange={handleAlunoInputChange}
        onCheckboxChange={handleCheckbox}
        onDisciplinaChange={setDisciplina}
        onHorarioChange={setHorario}
        onObservacaoChange={setObservacao}
        onOutroChange={setOutro}
        onRemoverAluno={removerAluno}
        onSubmit={handleSubmit}
        onTurmaChange={setTurma}
        onTurnoChange={setTurno}
        onVoltar={handleBack}
      />

      <section className="ocorrencias-consulta" aria-label="Consulta de ocorrências">
        <div className="ocorrencias-filtros">
          <div className="filtros-topo">
            <div>
              <h2>Pesquisar ocorrências</h2>
              <p>
                {ocorrenciasFiltradas.length} de {ocorrenciasVisiveis.length}{" "}
                ocorrência(s)
              </p>
            </div>

            <button
              type="button"
              className="btn-limpar-filtros"
              onClick={limparFiltros}
              disabled={!filtrosAtivos}
            >
              Limpar
            </button>
          </div>

          <div className="filtros-grid">
            <label>
              Nome do aluno
              <input
                type="search"
                placeholder="Pesquisar por nome"
                value={filtros.nome}
                onChange={(event) => atualizarFiltro("nome", event.target.value)}
              />
            </label>

            <label>
              Data
              <input
                type="date"
                value={filtros.data}
                onChange={(event) => atualizarFiltro("data", event.target.value)}
              />
            </label>

            <label>
              Turno
              <select
                value={filtros.turno}
                onChange={(event) => atualizarFiltro("turno", event.target.value)}
              >
                <option value="">Todos</option>
                <option value="manha">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </label>

            <label>
              Professor
              <select
                value={filtros.professor}
                onChange={(event) => atualizarFiltro("professor", event.target.value)}
              >
                <option value="">Todos</option>
                {professoresDisponiveis.map((professor) => (
                  <option key={professor} value={professor}>
                    {professor}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="filtros-tipos">
            <legend>Ocorrência</legend>
            {tiposDisponiveis.length > 0 ? (
              tiposDisponiveis.map((tipo) => (
                <label key={tipo}>
                  <input
                    type="checkbox"
                    checked={filtros.tipos.includes(tipo)}
                    onChange={() => alternarFiltroTipo(tipo)}
                  />
                  <span>{tipo}</span>
                </label>
              ))
            ) : (
              <p>Nenhum tipo registrado ainda.</p>
            )}
          </fieldset>
        </div>

        <ListaOcorrencias
          ocorrencias={ocorrenciasFiltradas}
          onRemoveOcorrencia={handleRemoveOcorrencia}
        />
      </section>
    </div>
  );
}

export default Ocorrencias;

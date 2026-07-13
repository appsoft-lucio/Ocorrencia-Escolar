import "./professor.css";
import Header from "../../components/Header/Header";
import Sidebar from "../../components/Sidebar/Sidebar";
import ProfessorCard from "../../components/Cards/professorCard/professorCard";
import { useContext, useState, useEffect, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useMensagemComAlerta } from "../../hooks/useMensagemComAlerta";
import { OcorrenciaContext } from "../../context/OcorrenciaContext";
import {
  atualizarProfessorSupabase,
  atualizarStatusProfessorSupabase,
  listarProfessoresSupabase,
} from "../../services/perfisService";
import { criarUsuarioEscolaSupabase } from "../../services/usuariosService";

const CINCO_ANOS_EM_MS = 5 * 365 * 24 * 60 * 60 * 1000;

function professorDentroDoPrazoDeRetencao(professor) {
  if (professor.status !== "inativo" || !professor.desativadoEm) return true;

  const dataDesativacao = new Date(professor.desativadoEm).getTime();

  if (Number.isNaN(dataDesativacao)) return true;

  return Date.now() - dataDesativacao < CINCO_ANOS_EM_MS;
}

function criarTurma(codigo) {
  return {
    id: `${codigo}-${Date.now()}`,
    codigo,
    status: "ativo",
    desativadaEm: null,
  };
}

function normalizarTurma(turma) {
  if (typeof turma === "string") {
    return {
      id: turma,
      codigo: turma,
      status: "ativo",
      desativadaEm: null,
    };
  }

  return {
    ...turma,
    id: turma.id || turma.codigo || String(Date.now()),
    codigo: turma.codigo || turma.nome || "",
    status: turma.status || "ativo",
    desativadaEm: turma.desativadaEm || null,
  };
}

function normalizarTurmas(turmas = []) {
  return turmas.map(normalizarTurma).filter((turma) => turma.codigo);
}

function turmaEstaAtiva(turma) {
  return normalizarTurma(turma).status !== "inativo";
}

function criarChaveEscola(chave, escolaId) {
  return escolaId ? `${chave}:${escolaId}` : chave;
}

function criarTurmaProfessorSupabase(professorId, codigo) {
  return {
    id: `${professorId}-${codigo}`,
    codigo,
    status: "ativo",
    desativadaEm: null,
  };
}

function Professor() {
  const { user } = useContext(AuthContext);
  const { ocorrencias } = useContext(OcorrenciaContext);
  const usarSupabase = user?.origem === "supabase";
  const professoresStorageKey = criarChaveEscola("professores", user?.escolaId);

  // Estados do modal de criar
  const [abrirModal, setAbrirModal] = useState(false);

  // Estados do modal de detalhes
  const [abrirModalDetalhes, setAbrirModalDetalhes] = useState(false);
  const [professorSelecionado, setProfessorSelecionado] = useState(null);

  // Estados do modal de edição
  const [abrirModalEdicao, setAbrirModalEdicao] = useState(false);
  const [professorEmEdicao, setProfessorEmEdicao] = useState(null);

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: "",
    login: "",
    email: "",
    whatsapp: "",
    senha: "",
    disciplina: "",
    turno: "Manhã",
    novaTurma: "",
    turmas: [],
  });
  const [mensagem, setMensagem] = useMensagemComAlerta();
  const [filtros, setFiltros] = useState({
    busca: "",
    status: "",
    turma: "",
  });

  // Estados dos dados
  const [professores, setProfessores] = useState(() => {
    const stored = localStorage.getItem(professoresStorageKey);

    const professoresIniciais = stored ? JSON.parse(stored) : [];
    /*
          {
            id: 1,
            nome: "João Silva",
            disciplina: "Matemática",
            turno: "Manhã",
            turmas: ["101", "102", "201"],
            ocorrencias: 18,
          },
          {
            id: 2,
            nome: "Maria Souza",
            disciplina: "Português",
            turno: "Tarde",
            turmas: ["301", "302"],
            ocorrencias: 9,
          },
          {
            id: 3,
            nome: "Carlos Oliveira",
            disciplina: "História",
            turno: "Manhã",
            turmas: ["401", "402"],
            ocorrencias: 5,
          },
          {
            id: 4,
            nome: "Ana Paula",
            disciplina: "Ciências",
            turno: "Noite",
            turmas: ["1001", "1002"],
            ocorrencias: 12,
          },
        ];
    */

    return professoresIniciais
      .map((professor) => ({
        ...professor,
        status: professor.status || "ativo",
        desativadoEm: professor.desativadoEm || null,
        turmas: normalizarTurmas(professor.turmas),
      }))
      .filter(professorDentroDoPrazoDeRetencao);
  });

  // Salvar no localStorage sempre que professores mudam
  useEffect(() => {
    if (usarSupabase) return;
    localStorage.setItem(professoresStorageKey, JSON.stringify(professores));
  }, [professores, professoresStorageKey, usarSupabase]);

  useEffect(() => {
    let ativo = true;

    if (!usarSupabase || !user?.escolaId) return undefined;

    listarProfessoresSupabase(user)
      .then((perfis) => {
        if (!ativo) return;

        setProfessores(
          perfis.map((perfil) => {
            const ocorrenciasProfessor = ocorrencias.filter((ocorrencia) => {
              const mesmoId = ocorrencia.professorId === perfil.id;
              const mesmoNome =
                ocorrencia.professorNome?.toLowerCase() ===
                perfil.nome.toLowerCase();

              return mesmoId || mesmoNome;
            });
            const turmas = Array.from(
              new Set(
                ocorrenciasProfessor
                  .map((ocorrencia) => ocorrencia.turma)
                  .filter(Boolean),
              ),
            ).map((turma) => criarTurmaProfessorSupabase(perfil.id, turma));

            return {
              id: perfil.id,
              nome: perfil.nome,
              login: perfil.login,
              email: perfil.email,
              whatsapp: perfil.whatsapp,
              disciplina: perfil.disciplina || "Nao informada",
              turno: perfil.turno || "Nao informado",
              turmas: normalizarTurmas(perfil.turmas).length
                ? normalizarTurmas(perfil.turmas)
                : turmas,
              ocorrencias: ocorrenciasProfessor.length,
              status: perfil.status,
              desativadoEm:
                perfil.status === "inativo" ? perfil.atualizadoEm : null,
              origem: "supabase",
            };
          }),
        );
      })
      .catch((error) => {
        console.error("Erro ao carregar professores no Supabase:", error);
        if (ativo) {
          setMensagem("Nao foi possivel carregar professores do Supabase.");
        }
      });

    return () => {
      ativo = false;
    };
  }, [ocorrencias, setMensagem, usarSupabase, user]);

  const professoresResumo = useMemo(() => {
    const ativos = professores.filter((professor) => professor.status !== "inativo");
    const turmasAtivas = new Set(
      professores.flatMap((professor) =>
        normalizarTurmas(professor.turmas)
          .filter(turmaEstaAtiva)
          .map((turma) => turma.codigo),
      ),
    );

    return {
      total: professores.length,
      ativos: ativos.length,
      inativos: professores.length - ativos.length,
      turmas: turmasAtivas.size,
    };
  }, [professores]);

  const turmasDisponiveis = useMemo(
    () =>
      Array.from(
        new Set(
          professores.flatMap((professor) =>
            normalizarTurmas(professor.turmas).map((turma) => turma.codigo),
          ),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR", { numeric: true })),
    [professores],
  );

  const professoresFiltrados = useMemo(() => {
    const termo = filtros.busca
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

    return professores.filter((professor) => {
      const turmas = normalizarTurmas(professor.turmas);
      const textoProfessor = [professor.nome, professor.disciplina, professor.turno]
        .join(" ")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const buscaOk =
        !termo ||
        textoProfessor.includes(termo) ||
        turmas.some((turma) => turma.codigo.toLowerCase().includes(termo));
      const statusOk = !filtros.status || professor.status === filtros.status;
      const turmaOk =
        !filtros.turma || turmas.some((turma) => turma.codigo === filtros.turma);

      return buscaOk && statusOk && turmaOk;
    });
  }, [filtros, professores]);

  const atualizarFiltro = (campo, valor) => {
    setFiltros((filtrosAtuais) => ({
      ...filtrosAtuais,
      [campo]: valor,
    }));
  };

  const limparFiltros = () => {
    setFiltros({ busca: "", status: "", turma: "" });
  };

  const limparFormulario = () => {
    setFormData({
      nome: "",
      login: "",
      email: "",
      whatsapp: "",
      senha: "",
      disciplina: "",
      turno: "Manhã",
      novaTurma: "",
      turmas: [],
    });
    setMensagem("");
  };

  const fecharModal = () => {
    limparFormulario();
    setAbrirModal(false);
  };

  const adicionarTurma = () => {
    const codigoTurma = formData.novaTurma.trim();

    if (!codigoTurma) {
      setMensagem("Digite o código da turma.");
      return;
    }

    const turmaExistente = formData.turmas.find(
      (item) =>
        normalizarTurma(item).codigo.toLowerCase() ===
        codigoTurma.toLowerCase(),
    );

    if (turmaExistente && turmaEstaAtiva(turmaExistente)) {
      setMensagem("Esta turma já está ativa.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      turmas: turmaExistente
        ? prev.turmas.map((item) => {
            const turmaAtual = normalizarTurma(item);

            return turmaAtual.codigo.toLowerCase() ===
              codigoTurma.toLowerCase()
              ? { ...turmaAtual, status: "ativo", desativadaEm: null }
              : turmaAtual;
          })
        : [...prev.turmas, criarTurma(codigoTurma)],
      novaTurma: "",
    }));
    setMensagem(
      turmaExistente
        ? "Turma reativada com sucesso."
        : "Turma adicionada com sucesso.",
    );
  };

  const alternarStatusTurma = (codigoTurma) => {
    setFormData((prev) => ({
      ...prev,
      turmas: prev.turmas.map((item) => {
        const turma = normalizarTurma(item);

        if (turma.codigo !== codigoTurma) return turma;

        const estaInativa = turma.status === "inativo";

        return {
          ...turma,
          status: estaInativa ? "ativo" : "inativo",
          desativadaEm: estaInativa ? null : new Date().toISOString(),
        };
      }),
    }));
  };
  const salvarProfessor = async () => {
    if (!formData.nome.trim()) {
      setMensagem("Informe o nome do professor.");
      return;
    }

    if (usarSupabase) {
      if (!formData.login.trim()) {
        setMensagem("Informe o usuario do professor.");
        return;
      }

      if (!formData.email.trim()) {
        setMensagem("Informe o email do professor.");
        return;
      }

      if (!formData.whatsapp.trim()) {
        setMensagem("Informe o WhatsApp do professor.");
        return;
      }

      if (!formData.senha.trim()) {
        setMensagem("Informe a senha provisoria.");
        return;
      }

      if (formData.senha.length < 6) {
        setMensagem("A senha deve ter pelo menos 6 caracteres.");
        return;
      }
    }

    if (!formData.disciplina.trim()) {
      setMensagem("Informe a disciplina.");
      return;
    }

    if (!formData.turmas.some(turmaEstaAtiva)) {
      setMensagem("Adicione pelo menos uma turma ativa.");
      return;
    }

    try {
      const professorBase = {
        id: Date.now(),
        nome: formData.nome.trim(),
        login: formData.login.trim(),
        email: formData.email.trim(),
        whatsapp: formData.whatsapp.trim(),
        disciplina: formData.disciplina,
        turno: formData.turno,
        turmas: normalizarTurmas(formData.turmas),
        ocorrencias: 0,
        status: "ativo",
        desativadoEm: null,
      };

      if (usarSupabase) {
        const professorCriado = await criarUsuarioEscolaSupabase({
          nome: formData.nome.trim(),
          login: formData.login.trim(),
          email: formData.email.trim(),
          senha: formData.senha,
          perfil: "professor",
          whatsapp: formData.whatsapp.trim(),
          status: "ativo",
          disciplina: formData.disciplina,
          turno: formData.turno,
          turmas: normalizarTurmas(formData.turmas).map((turma) => turma.codigo),
        });

        setProfessores((prev) => [
          ...prev,
          {
            ...professorBase,
            id: professorCriado.id,
            origem: "supabase",
          },
        ]);
      } else {
        setProfessores((prev) => [...prev, professorBase]);
      }

      setMensagem("Professor adicionado com sucesso!");

      setTimeout(() => {
        fecharModal();
      }, 1000);
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel cadastrar o professor.");
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMensagem("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") adicionarTurma();
  };

  // Ações dos botões dos cards
  const verDetalhes = (professor) => {
    setProfessorSelecionado(professor);
    setAbrirModalDetalhes(true);
  };

  const editarProfessor = (professor) => {
    setProfessorEmEdicao(professor);
    setFormData({
      nome: professor.nome,
      login: professor.login || "",
      email: professor.email || "",
      whatsapp: professor.whatsapp || "",
      senha: "",
      disciplina: professor.disciplina,
      turno: professor.turno,
      novaTurma: "",
      turmas: normalizarTurmas(professor.turmas),
    });
    setAbrirModalEdicao(true);
  };

  const salvarEdicao = async () => {
    if (!formData.nome.trim()) {
      setMensagem("Informe o nome do professor.");
      return;
    }

    if (usarSupabase && !formData.email.trim()) {
      setMensagem("Informe o email do professor.");
      return;
    }

    if (usarSupabase && !formData.whatsapp.trim()) {
      setMensagem("Informe o WhatsApp do professor.");
      return;
    }

    if (!formData.disciplina.trim()) {
      setMensagem("Informe a disciplina.");
      return;
    }

    if (!formData.turmas.some(turmaEstaAtiva)) {
      setMensagem("Adicione pelo menos uma turma ativa.");
      return;
    }

    const professorAtualizado = {
      nome: formData.nome.trim(),
      email: formData.email.trim(),
      whatsapp: formData.whatsapp.trim(),
      disciplina: formData.disciplina.trim(),
      turno: formData.turno,
      turmas: normalizarTurmas(formData.turmas),
    };

    try {
      if (usarSupabase) {
        await atualizarProfessorSupabase(
          professorEmEdicao.id,
          {
            ...professorAtualizado,
            turmas: professorAtualizado.turmas.map((turma) => turma.codigo),
          },
          user,
        );
      }

      setProfessores((prev) =>
        prev.map((prof) =>
          prof.id === professorEmEdicao.id
            ? {
                ...prof,
                ...professorAtualizado,
              }
            : prof,
        ),
      );
      setMensagem("Professor atualizado com sucesso!");
      setTimeout(() => {
        fecharModalEdicao();
      }, 1000);
    } catch (error) {
      setMensagem(error.message || "Nao foi possivel atualizar o professor.");
    }
  };

  const alternarStatusProfessor = async (professorId) => {
    const professor = professores.find((prof) => prof.id === professorId);
    const estaInativo = professor?.status === "inativo";
    const acao = estaInativo ? "reativar" : "desativar";

    if (window.confirm(`Tem certeza que deseja ${acao} este professor?`)) {
      if (usarSupabase) {
        try {
          const perfilAtualizado = await atualizarStatusProfessorSupabase(
            professorId,
            estaInativo ? "ativo" : "inativo",
            user,
          );
          setProfessores((prev) =>
            prev.map((prof) =>
              prof.id === professorId
                ? {
                    ...prof,
                    status: perfilAtualizado.status,
                    desativadoEm:
                      perfilAtualizado.status === "inativo"
                        ? perfilAtualizado.atualizadoEm
                        : null,
                  }
                : prof,
            ),
          );
          return;
        } catch (error) {
          console.error("Erro ao atualizar professor:", error);
          setMensagem("Nao foi possivel atualizar o professor.");
          return;
        }
      }

      setProfessores((prev) =>
        prev.map((prof) =>
          prof.id === professorId
            ? {
                ...prof,
                status: estaInativo ? "ativo" : "inativo",
                desativadoEm: estaInativo ? null : new Date().toISOString(),
              }
            : prof,
        ),
      );
    }
  };

  const fecharModalEdicao = () => {
    setProfessorEmEdicao(null);
    setAbrirModalEdicao(false);
    limparFormulario();
  };
  return (
    <div className="professores-layout">
      <Sidebar />

      <div className="professores-main">
        <Header />

        {/* Modal de detalhes */}
        {abrirModalDetalhes && professorSelecionado && (
          <div className="modal-overlay">
            <div className="modal-detalhes">
              <button
                className="btn-fechar-modal"
                onClick={() => setAbrirModalDetalhes(false)}
                title="Fechar"
              >
                ×
              </button>

              <h2>{professorSelecionado.nome}</h2>

              <div className="detalhes-conteudo">
                <div className="detalhe-item">
                  <strong>Status:</strong>
                  <p>
                    {professorSelecionado.status === "inativo"
                      ? "Desativado"
                      : "Ativo"}
                  </p>
                </div>

                {professorSelecionado.status === "inativo" &&
                  professorSelecionado.desativadoEm && (
                    <div className="detalhe-item">
                      <strong>Desativado em:</strong>
                      <p>
                        {new Date(
                          professorSelecionado.desativadoEm,
                        ).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  )}

                <div className="detalhe-item">
                  <strong>Disciplina:</strong>
                  <p>{professorSelecionado.disciplina}</p>
                </div>

                <div className="detalhe-item">
                  <strong>Turno:</strong>
                  <p>{professorSelecionado.turno}</p>
                </div>

                <div className="detalhe-item">
                  <strong>
                    Turmas ativas (
                    {normalizarTurmas(professorSelecionado.turmas).filter(
                      turmaEstaAtiva,
                    ).length}
                    ):
                  </strong>
                  <div className="turmas-detalhes">
                    {normalizarTurmas(professorSelecionado.turmas).map(
                      (turma) => (
                      <span
                        key={turma.id}
                        className={`turma-badge ${
                          turma.status === "inativo" ? "turma-inativa" : ""
                        }`}
                      >
                        {turma.codigo}
                        {turma.status === "inativo" ? " (desativada)" : ""}
                      </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="detalhe-item">
                  <strong>Total de Ocorrências:</strong>
                  <p className="ocorrencias-total">
                    {professorSelecionado.ocorrencias}
                  </p>
                </div>
              </div>

              <div className="modal-botoes">
                <button
                  type="button"
                  onClick={() => setAbrirModalDetalhes(false)}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de edição */}
        {abrirModalEdicao && professorEmEdicao && (
          <div className="modal-overlay">
            <div className="modal-professor">
              <h2>Editar Professor</h2>

              {mensagem && (
                <div
                  className={`mensagem ${mensagem.includes("sucesso") ? "sucesso" : "erro"}`}
                >
                  {mensagem}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nome-edicao">Nome do Professor</label>
                <input
                  id="nome-edicao"
                  type="text"
                  name="nome"
                  placeholder="Ex: João Silva"
                  value={formData.nome}
                  onChange={handleInputChange}
                />
              </div>

              {usarSupabase && (
                <div className="form-grid-duplo">
                  <div className="form-group">
                    <label htmlFor="email-edicao">Email</label>
                    <input
                      id="email-edicao"
                      type="email"
                      name="email"
                      placeholder="professor@escola.com"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp-edicao">WhatsApp</label>
                    <input
                      id="whatsapp-edicao"
                      type="text"
                      name="whatsapp"
                      placeholder="(31) 99999-9999"
                      value={formData.whatsapp}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="disciplina-edicao">Disciplina</label>
                <input
                  id="disciplina-edicao"
                  type="text"
                  name="disciplina"
                  placeholder="Ex: Matemática"
                  value={formData.disciplina}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="turno-edicao">Turno</label>
                <select
                  id="turno-edicao"
                  name="turno"
                  value={formData.turno}
                  onChange={handleInputChange}
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>

              <div className="turmas-section">
                <h3>Turmas</h3>

                <div className="turma-adicionar">
                  <input
                    type="text"
                    name="novaTurma"
                    placeholder="Ex: 101"
                    value={formData.novaTurma}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    aria-label="Código da turma"
                  />

                  <button
                    type="button"
                    className="btn-add-turma"
                    onClick={adicionarTurma}
                    title="Adicionar turma"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="lista-turmas">
                  {formData.turmas.length > 0 ? (
                    formData.turmas.map((item) => {
                      const turma = normalizarTurma(item);
                      const estaInativa = turma.status === "inativo";

                      return (
                      <div
                        key={turma.id}
                        className={`turma-item ${estaInativa ? "turma-inativa" : ""}`}
                      >
                        <span>
                          {turma.codigo}
                          {estaInativa ? " (desativada)" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => alternarStatusTurma(turma.codigo)}
                          title={estaInativa ? "Reativar turma" : "Desativar turma"}
                          aria-label={`${estaInativa ? "Reativar" : "Desativar"} turma ${turma.codigo}`}
                        >
                          {estaInativa ? "Reativar" : "Desativar"}
                        </button>
                      </div>
                      );
                    })
                  ) : (
                    <p className="vazio">Nenhuma turma adicionada</p>
                  )}
                </div>
              </div>

              <div className="modal-botoes">
                <button type="button" onClick={fecharModalEdicao}>
                  Cancelar
                </button>

                <button type="button" onClick={salvarEdicao}>
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de criar */}
        {abrirModal && (
          <div className="modal-overlay">
            <div className="modal-professor">
              <h2>Novo Professor</h2>

              {mensagem && (
                <div
                  className={`mensagem ${mensagem.includes("sucesso") ? "sucesso" : "erro"}`}
                >
                  {mensagem}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nome">Nome do Professor</label>
                <input
                  id="nome"
                  type="text"
                  name="nome"
                  placeholder="Ex: João Silva"
                  value={formData.nome}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-grid-duplo">
                <div className="form-group">
                  <label htmlFor="login-professor">Usuario</label>
                  <input
                    id="login-professor"
                    type="text"
                    name="login"
                    placeholder="Ex: joao.silva"
                    value={formData.login}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="senha-professor">Senha provisoria</label>
                  <input
                    id="senha-professor"
                    type="password"
                    minLength={6}
                    aria-describedby="regra-senha-professor"
                    name="senha"
                    placeholder="Senha"
                    value={formData.senha}
                    onChange={handleInputChange}
                  />
                  <small id="regra-senha-professor">
                    Use pelo menos 6 caracteres.
                  </small>
                </div>
              </div>

              <div className="form-grid-duplo">
                <div className="form-group">
                  <label htmlFor="email-professor">Email</label>
                  <input
                    id="email-professor"
                    type="email"
                    name="email"
                    placeholder="professor@escola.com"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="whatsapp-professor">WhatsApp</label>
                  <input
                    id="whatsapp-professor"
                    type="text"
                    name="whatsapp"
                    placeholder="(31) 99999-9999"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="disciplina">Disciplina</label>
                <input
                  id="disciplina"
                  type="text"
                  name="disciplina"
                  placeholder="Ex: Matemática"
                  value={formData.disciplina}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="turno">Turno</label>
                <select
                  id="turno"
                  name="turno"
                  value={formData.turno}
                  onChange={handleInputChange}
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>

              <div className="turmas-section">
                <h3>Turmas</h3>

                <div className="turma-adicionar">
                  <input
                    type="text"
                    name="novaTurma"
                    placeholder="Ex: 101"
                    value={formData.novaTurma}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    aria-label="Código da turma"
                  />
                  <button
                    type="button"
                    className="btn-add-turma"
                    onClick={adicionarTurma}
                    title="Adicionar turma"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="lista-turmas">
                  {formData.turmas.length > 0 ? (
                    formData.turmas.map((item) => {
                      const turma = normalizarTurma(item);
                      const estaInativa = turma.status === "inativo";

                      return (
                      <div
                        key={turma.id}
                        className={`turma-item ${estaInativa ? "turma-inativa" : ""}`}
                      >
                        <span>
                          {turma.codigo}
                          {estaInativa ? " (desativada)" : ""}
                        </span>
                        <button
                          type="button"
                          onClick={() => alternarStatusTurma(turma.codigo)}
                          title={estaInativa ? "Reativar turma" : "Desativar turma"}
                          aria-label={`${estaInativa ? "Reativar" : "Desativar"} turma ${turma.codigo}`}
                        >
                          {estaInativa ? "Reativar" : "Desativar"}
                        </button>
                      </div>
                      );
                    })
                  ) : (
                    <p className="vazio">Nenhuma turma adicionada</p>
                  )}
                </div>
              </div>

              <div className="modal-botoes">
                <button type="button" onClick={fecharModal}>
                  Cancelar
                </button>
                <button type="button" onClick={salvarProfessor}>
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="professores-content">
          <div className="professores-topo">
            <div>
              <h1>Professores</h1>
              <h2>Gerenciamento de professores e turmas</h2>
            </div>

            <button
              className="btn-novo-professor"
              onClick={() => setAbrirModal(true)}
            >
              Novo Professor
            </button>
          </div>

          <p className="professores-descricao">
            Bem-vindo, <strong>{user?.nome}</strong>. Nesta página é possível
            visualizar os professores cadastrados, as turmas em que lecionam, o
            turno de atuação, a quantidade de ocorrências registradas e o status
            do vínculo com a escola.
          </p>

          <section className="professores-resumo" aria-label="Resumo de professores">
            <div>
              <strong>{professoresResumo.total}</strong>
              <span>Total</span>
            </div>
            <div>
              <strong>{professoresResumo.ativos}</strong>
              <span>Ativos</span>
            </div>
            <div>
              <strong>{professoresResumo.inativos}</strong>
              <span>Desativados</span>
            </div>
            <div>
              <strong>{professoresResumo.turmas}</strong>
              <span>Turmas ativas</span>
            </div>
          </section>

          <section className="professores-filtros" aria-label="Filtros de professores">
            <label>
              Buscar
              <input
                type="search"
                placeholder="Nome, disciplina ou turma"
                value={filtros.busca}
                onChange={(event) => atualizarFiltro("busca", event.target.value)}
              />
            </label>

            <label>
              Status
              <select
                value={filtros.status}
                onChange={(event) => atualizarFiltro("status", event.target.value)}
              >
                <option value="">Todos</option>
                <option value="ativo">Ativos</option>
                <option value="inativo">Desativados</option>
              </select>
            </label>

            <label>
              Turma
              <select
                value={filtros.turma}
                onChange={(event) => atualizarFiltro("turma", event.target.value)}
              >
                <option value="">Todas</option>
                {turmasDisponiveis.map((turma) => (
                  <option key={turma} value={turma}>
                    {turma}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" onClick={limparFiltros}>
              Limpar
            </button>
          </section>

          <section className="professores-cards">
            {professoresFiltrados.length > 0 ? (
              professoresFiltrados.map((professor) => (
                <ProfessorCard
                  key={professor.id}
                  nome={professor.nome}
                  disciplina={professor.disciplina}
                  turno={professor.turno}
                  turmas={professor.turmas}
                  ocorrencias={professor.ocorrencias}
                  status={professor.status}
                  desativadoEm={professor.desativadoEm}
                  onDetalhes={() => verDetalhes(professor)}
                  onEditar={() => editarProfessor(professor)}
                  onAlternarStatus={() => alternarStatusProfessor(professor.id)}
                />
              ))
            ) : (
              <p className="sem-dados">Nenhum professor cadastrado.</p>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export default Professor;


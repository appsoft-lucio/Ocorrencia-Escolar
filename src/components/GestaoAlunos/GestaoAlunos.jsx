import "./GestaoAlunos.css";

import { useEffect, useMemo, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import {
  arquivarAlunoSupabase,
  atualizarAlunoSupabase,
  atualizarStatusAlunoSupabase,
  criarAlunoSupabase,
  importarAlunosSupabase,
} from "../../services/alunosService";
import { useMensagemComAlerta } from "../../hooks/useMensagemComAlerta";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const FORM_INICIAL = { id: null, nome: "", turmaId: "", turno: "" };

function nomesDoTexto(texto) {
  const ignorar = /^(alunos?|nome|turma|turno|lista|diario|matricula|n[ºo°]|página|pagina|total)$/i;
  const linhas = texto.split(/\r?\n/);
  const linhasDaTabela = linhas.filter((linha) => /^\s*\d+\s+\d{6,}\s+/.test(linha));
  const candidatas = linhasDaTabela.length ? linhasDaTabela : linhas;

  return [...new Set(
    candidatas
      .map((linha) => linha
        .replace(/^\s*\d+[.)º°-]?\s*/, "")
        .replace(/^\d{6,}\s+/, "")
        .trim())
      .filter((linha) =>
        linha.length >= 5 &&
        linha.length <= 100 &&
        linha.includes(" ") &&
        /^[A-Za-zÀ-ÿ' -]+$/.test(linha) &&
        !ignorar.test(linha),
      ),
  )];
}

function normalizar(valor = "") {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function dadosDoCabecalho(texto, turmas) {
  const linhaTurma = texto.match(/Turma:\s*(.+?)\s+Turno:\s*([^\n]+)/i);
  const descricaoTurma = linhaTurma?.[1]?.trim() || "";
  const turnoEncontrado = linhaTurma?.[2]?.trim().split(/\s{2,}|Professor:/i)[0] || "";
  const turma = turmas.find((item) => {
    const codigo = normalizar(item.codigo);
    const descricao = normalizar(descricaoTurma);
    return codigo && (descricao === codigo || descricao.includes(codigo));
  });
  const turno = ["Manha", "Tarde", "Noite", "Integral"].find(
    (item) => normalizar(item) === normalizar(turnoEncontrado),
  ) || "";

  return { turmaId: turma?.id || "", turno };
}

async function extrairTextoPDF(arquivo) {
  const pdf = await pdfjsLib.getDocument({ data: await arquivo.arrayBuffer() }).promise;
  const linhas = [];

  for (let paginaNumero = 1; paginaNumero <= pdf.numPages; paginaNumero += 1) {
    const pagina = await pdf.getPage(paginaNumero);
    const conteudo = await pagina.getTextContent();
    const porLinha = new Map();

    conteudo.items.forEach((item) => {
      const y = Math.round(item.transform[5]);
      const atual = porLinha.get(y) || [];
      atual.push({ x: item.transform[4], texto: item.str });
      porLinha.set(y, atual);
    });

    [...porLinha.entries()]
      .sort((a, b) => b[0] - a[0])
      .forEach(([, itens]) => {
        linhas.push(itens.sort((a, b) => a.x - b.x).map((item) => item.texto).join(" "));
      });
  }

  return linhas.join("\n");
}

function GestaoAlunos({ user, turmas, alunos, setAlunos, salvarLocais, usarSupabase, ocorrencias }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [turmasSelecionadas, setTurmasSelecionadas] = useState([]);
  const [importacao, setImportacao] = useState({ aberta: false, turmaId: "", turno: "", nomes: [] });
  const [importando, setImportando] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [mensagem, setMensagem] = useMensagemComAlerta();
  const dialogoRef = useRef(null);

  useEffect(() => {
    if (!confirmacao) return undefined;

    dialogoRef.current?.focus();
    const fecharComEsc = (event) => {
      if (event.key === "Escape") setConfirmacao(null);
    };
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [confirmacao]);

  const turmaSelecionada = turmas.find((turma) => turma.id === form.turmaId);
  const alunosVisiveis = useMemo(
    () => alunos.filter(
      (aluno) =>
        turmasSelecionadas.includes(aluno.turmaId) &&
        (mostrarArquivados || !aluno.arquivadoEm),
    ),
    [alunos, mostrarArquivados, turmasSelecionadas],
  );
  const turmasAtivas = useMemo(
    () => turmas.filter((turma) => turma.cadastrado && turma.status !== "inativo"),
    [turmas],
  );
  const comparativo = useMemo(
    () => turmasSelecionadas.map((turmaId) => {
      const turma = turmas.find((item) => item.id === turmaId);
      const alunosDaTurma = alunos.filter(
        (aluno) => aluno.turmaId === turmaId && !aluno.arquivadoEm,
      );
      return {
        id: turmaId,
        codigo: turma?.codigo || "Turma",
        ativos: alunosDaTurma.filter((aluno) => aluno.status === "ativo").length,
        inativos: alunosDaTurma.filter((aluno) => aluno.status === "inativo").length,
        total: alunosDaTurma.length,
        ocorrencias: ocorrencias.filter(
          (ocorrencia) => normalizar(ocorrencia.turma) === normalizar(turma?.codigo),
        ).length,
      };
    }),
    [alunos, ocorrencias, turmas, turmasSelecionadas],
  );
  const ocorrenciasPorAluno = useMemo(() => {
    const totais = new Map();
    ocorrencias.forEach((ocorrencia) => {
      (ocorrencia.alunos || []).forEach((nome) => {
        const chave = normalizar(nome);
        totais.set(chave, (totais.get(chave) || 0) + 1);
      });
    });
    return totais;
  }, [ocorrencias]);

  function alternarTurmaSelecionada(turmaId) {
    setTurmasSelecionadas((atuais) =>
      atuais.includes(turmaId)
        ? atuais.filter((id) => id !== turmaId)
        : [...atuais, turmaId],
    );
  }

  function atualizarLista(proximos) {
    if (usarSupabase) setAlunos(proximos);
    else salvarLocais(proximos);
  }

  async function salvar(event) {
    event.preventDefault();
    if (!form.nome.trim() || !form.turmaId || !form.turno) {
      setMensagem("Informe nome completo, turma e turno.");
      return;
    }

    const alunoExistente = alunos.find(
      (aluno) =>
        aluno.id !== form.id &&
        !aluno.arquivadoEm &&
        normalizar(aluno.nome) === normalizar(form.nome),
    );

    if (alunoExistente) {
      const turmaAtual = turmas.find((item) => item.id === alunoExistente.turmaId);
      const turmaDestino = turmas.find((item) => item.id === form.turmaId);

      if (form.id) {
        setMensagem(
          `Ja existe outro cadastro para ${alunoExistente.nome} nesta escola.`,
        );
        return;
      }

      if (alunoExistente.turmaId === form.turmaId) {
        setMensagem(
          `${alunoExistente.nome} ja esta cadastrado na turma ${turmaAtual?.codigo || "selecionada"}.`,
        );
        return;
      }

      setConfirmacao({
        tipo: "cadastro",
        aluno: alunoExistente,
        turmaAtual: turmaAtual?.codigo || "turma atual",
        turmaDestino: turmaDestino?.codigo || "turma selecionada",
        turmaDestinoId: form.turmaId,
        turnoDestino: form.turno,
      });
      return;
    }

    try {
      const dados = { ...form, nome: form.nome.trim() };
      let salvo;
      if (usarSupabase) {
        salvo = form.id
          ? await atualizarAlunoSupabase(user, form.id, dados)
          : await criarAlunoSupabase(user, dados);
      } else {
        salvo = {
          ...dados,
          id: form.id || crypto.randomUUID(),
          turma: turmaSelecionada?.codigo || "",
          status: form.id ? alunos.find((item) => item.id === form.id)?.status : "ativo",
        };
      }

      atualizarLista(
        form.id
          ? alunos.map((aluno) => (aluno.id === form.id ? salvo : aluno))
          : [...alunos, salvo].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
      );
      setTurmasSelecionadas((atuais) =>
        atuais.includes(form.turmaId) ? atuais : [...atuais, form.turmaId],
      );
      setMensagem(form.id ? "Aluno atualizado ou transferido com sucesso." : "Aluno cadastrado com sucesso.");
      setForm(FORM_INICIAL);
    } catch (error) {
      setMensagem(error.message);
    }
  }

  async function confirmarTransferenciaCadastro() {
    if (confirmacao?.tipo !== "cadastro") return;

    const dados = confirmacao;
    setConfirmacao(null);
    try {
      const dadosTransferencia = {
        nome: dados.aluno.nome,
        turmaId: dados.turmaDestinoId,
        turno: dados.turnoDestino,
      };
      const transferido = usarSupabase
        ? await atualizarAlunoSupabase(user, dados.aluno.id, dadosTransferencia)
        : {
            ...dados.aluno,
            ...dadosTransferencia,
            turma: dados.turmaDestino,
          };

      atualizarLista(
        alunos.map((aluno) =>
          aluno.id === dados.aluno.id ? transferido : aluno,
        ),
      );
      setTurmasSelecionadas((atuais) =>
        atuais.includes(dados.turmaDestinoId)
          ? atuais
          : [...atuais, dados.turmaDestinoId],
      );
      setMensagem(
        `${dados.aluno.nome} transferido para a turma ${dados.turmaDestino}.`,
      );
      setForm(FORM_INICIAL);
    } catch (error) {
      setMensagem(error.message);
    }
  }

  function cancelarConfirmacao() {
    if (confirmacao?.tipo === "cadastro") {
      setMensagem(
        `${confirmacao.aluno.nome} foi mantido na turma ${confirmacao.turmaAtual}.`,
      );
    } else if (confirmacao?.tipo === "importacao") {
      setMensagem("Importacao cancelada. Nenhum aluno foi alterado.");
    }
    setConfirmacao(null);
  }

  async function alternarStatus(aluno) {
    const status = aluno.status === "inativo" ? "ativo" : "inativo";
    try {
      const atualizado = usarSupabase
        ? await atualizarStatusAlunoSupabase(user, aluno.id, status)
        : { ...aluno, status };
      atualizarLista(alunos.map((item) => (item.id === aluno.id ? atualizado : item)));
      setMensagem(`Aluno ${status === "ativo" ? "ativado" : "inativado"} com sucesso.`);
    } catch (error) {
      setMensagem(error.message);
    }
  }

  async function arquivar(aluno) {
    if (!window.confirm(`Excluir ${aluno.nome} da lista ativa? O historico sera mantido.`)) return;
    try {
      if (usarSupabase) await arquivarAlunoSupabase(user, aluno.id);
      atualizarLista(alunos.map((item) =>
        item.id === aluno.id
          ? { ...item, status: "inativo", arquivadoEm: new Date().toISOString() }
          : item,
      ));
      setMensagem("Aluno excluido da lista ativa. O historico foi preservado.");
    } catch (error) {
      setMensagem(error.message);
    }
  }

  async function lerArquivo(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    try {
      const texto = arquivo.type === "application/pdf"
        ? await extrairTextoPDF(arquivo)
        : await arquivo.text();
      const nomes = nomesDoTexto(texto);
      const cabecalho = dadosDoCabecalho(texto, turmas);
      setImportacao((atual) => ({
        ...atual,
        aberta: true,
        nomes,
        turmaId: cabecalho.turmaId || atual.turmaId,
        turno: cabecalho.turno || atual.turno,
      }));
      setMensagem(`${nomes.length} possiveis nomes encontrados. Revise antes de importar.`);
    } catch (error) {
      console.error(error);
      setMensagem("Nao foi possivel ler este PDF. Ele pode ser uma imagem escaneada.");
    }
  }

  async function confirmarImportacao() {
    if (importando) return;

    if (!importacao.turmaId || !importacao.turno || importacao.nomes.length === 0) {
      setMensagem("Selecione turma e turno e mantenha pelo menos um nome.");
      return;
    }
    const turma = turmas.find((item) => item.id === importacao.turmaId);
    const existentes = new Map(
      alunos
        .filter((aluno) => !aluno.arquivadoEm)
        .map((aluno) => [normalizar(aluno.nome), aluno]),
    );
    const nomesUnicos = [...new Map(
      importacao.nomes.map((nome) => [normalizar(nome), nome]),
    ).values()];
    const novos = nomesUnicos
      .filter((nome) => !existentes.has(normalizar(nome)))
      .map((nome) => ({
        nome,
        turmaId: importacao.turmaId,
        turma: turma?.codigo || "",
        turno: importacao.turno,
        status: "ativo",
      }));
    const duplicadosOutraTurma = nomesUnicos
      .map((nome) => existentes.get(normalizar(nome)))
      .filter(
        (aluno) => aluno && aluno.turmaId !== importacao.turmaId,
      );
    const jaNaTurma = nomesUnicos.filter((nome) => {
      const aluno = existentes.get(normalizar(nome));
      return aluno?.turmaId === importacao.turmaId;
    }).length;

    if (duplicadosOutraTurma.length > 0) {
      setConfirmacao({
        tipo: "importacao",
        novos,
        duplicados: duplicadosOutraTurma,
        jaNaTurma,
        turmaDestino: turma?.codigo || "turma selecionada",
        turmaDestinoId: importacao.turmaId,
        turnoDestino: importacao.turno,
      });
      return;
    }

    if (novos.length === 0) {
      setMensagem("Todos os nomes da importacao ja estao cadastrados nesta turma.");
      return;
    }

    await executarImportacao(novos, [], jaNaTurma);
  }

  async function executarImportacao(novos, duplicados, jaNaTurma = 0) {
    const dadosConfirmacao = confirmacao;
    try {
      setImportando(true);
      const salvos = novos.length === 0
        ? []
        : usarSupabase
          ? await importarAlunosSupabase(user, novos)
          : novos.map((aluno) => ({ ...aluno, id: crypto.randomUUID() }));

      const transferidos = await Promise.all(
        duplicados.map(async (aluno) => {
          const dadosTransferencia = {
            nome: aluno.nome,
            turmaId: dadosConfirmacao.turmaDestinoId,
            turno: dadosConfirmacao.turnoDestino,
          };
          return usarSupabase
            ? atualizarAlunoSupabase(user, aluno.id, dadosTransferencia)
            : {
                ...aluno,
                ...dadosTransferencia,
                turma: dadosConfirmacao.turmaDestino,
              };
        }),
      );
      const transferidosPorId = new Map(
        transferidos.map((aluno) => [aluno.id, aluno]),
      );
      const listaAtualizada = alunos.map(
        (aluno) => transferidosPorId.get(aluno.id) || aluno,
      );
      atualizarLista(
        [...listaAtualizada, ...salvos].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        ),
      );
      setTurmasSelecionadas((atuais) =>
        atuais.includes(importacao.turmaId)
          ? atuais
          : [...atuais, importacao.turmaId],
      );
      setImportacao({ aberta: false, turmaId: "", turno: "", nomes: [] });
      setMensagem(
        `${salvos.length} aluno(s) novo(s) importado(s). ` +
          `${transferidos.length} aluno(s) transferido(s).` +
          (jaNaTurma > 0
            ? ` ${jaNaTurma} ja estava(m) na turma e foi(ram) mantido(s).`
            : ""),
      );
    } catch (error) {
      setMensagem(error.message);
    } finally {
      setImportando(false);
    }
  }

  async function confirmarTransferenciasImportacao() {
    if (confirmacao?.tipo !== "importacao" || importando) return;
    const dados = confirmacao;
    await executarImportacao(dados.novos, dados.duplicados, dados.jaNaTurma);
    setConfirmacao(null);
  }

  return (
    <section className="gestao-alunos">
      {confirmacao && (
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
              {confirmacao.tipo === "cadastro"
                ? "Aluno ja cadastrado"
                : "Alunos encontrados em outras turmas"}
            </h2>

            {confirmacao.tipo === "cadastro" ? (
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
                <p>
                  Os alunos abaixo ja estao cadastrados em outras turmas:
                </p>
                <ul className="confirmacao-aluno-lista">
                  {confirmacao.duplicados.map((aluno) => {
                    const turmaAtual = turmas.find(
                      (item) => item.id === aluno.turmaId,
                    );
                    return (
                      <li key={aluno.id}>
                        <strong>{aluno.nome}</strong>
                        <span>{turmaAtual?.codigo || "Turma atual"}</span>
                      </li>
                    );
                  })}
                </ul>
                <p>
                  Somente estes alunos serao transferidos para <strong>{confirmacao.turmaDestino}</strong>.
                  Os alunos novos serao cadastrados normalmente.
                </p>
              </div>
            )}

            <div className="confirmacao-aluno-acoes">
              <button
                type="button"
                className="btn-confirmacao-cancelar"
                onClick={cancelarConfirmacao}
                disabled={importando}
              >
                {confirmacao.tipo === "cadastro"
                  ? "Manter na turma atual"
                  : "Cancelar importacao"}
              </button>
              <button
                type="button"
                className="btn-confirmacao-transferir"
                onClick={
                  confirmacao.tipo === "cadastro"
                    ? confirmarTransferenciaCadastro
                    : confirmarTransferenciasImportacao
                }
                disabled={importando}
              >
                {importando
                  ? "Processando..."
                  : confirmacao.tipo === "cadastro"
                  ? "Transferir aluno"
                  : `Importar e transferir ${confirmacao.duplicados.length} aluno(s)`}
              </button>
            </div>
          </section>
        </div>
      )}
      <div className="gestao-alunos-cabecalho">
        <div><h2>Alunos das turmas</h2><p>Cadastre, transfira, inative ou arquive sem perder o histórico.</p></div>
        {user.permitirImportacaoAlunos && (
          <label className="botao-arquivo">Importar PDF<input type="file" accept="application/pdf,.txt" onChange={lerArquivo} /></label>
        )}
      </div>

      {mensagem && <div className="gestao-alunos-mensagem">{mensagem}</div>}

      <form className="gestao-alunos-form" onSubmit={salvar}>
        <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
        <select value={form.turmaId} onChange={(e) => {
          const turma = turmas.find((item) => item.id === e.target.value);
          setForm({ ...form, turmaId: e.target.value, turno: turma?.turno || form.turno });
        }}><option value="">Turma</option>{turmas.filter((t) => t.cadastrado && t.status !== "inativo").map((t) => <option key={t.id} value={t.id}>{t.codigo}</option>)}</select>
        <select value={form.turno} onChange={(e) => setForm({ ...form, turno: e.target.value })}><option value="">Turno</option>{["Manha", "Tarde", "Noite", "Integral"].map((t) => <option key={t}>{t}</option>)}</select>
        <button type="submit">{form.id ? "Atualizar/transferir" : "Cadastrar aluno"}</button>
        {form.id && <button type="button" onClick={() => setForm(FORM_INICIAL)}>Cancelar</button>}
      </form>

      {importacao.aberta && (
        <div className="importacao-alunos">
          <h3>Revisar importação</h3>
          <select value={importacao.turmaId} onChange={(e) => setImportacao({ ...importacao, turmaId: e.target.value })}><option value="">Turma de destino</option>{turmas.filter((t) => t.cadastrado && t.status !== "inativo").map((t) => <option key={t.id} value={t.id}>{t.codigo}</option>)}</select>
          <select value={importacao.turno} onChange={(e) => setImportacao({ ...importacao, turno: e.target.value })}><option value="">Turno</option>{["Manha", "Tarde", "Noite", "Integral"].map((t) => <option key={t}>{t}</option>)}</select>
          <textarea rows="10" value={importacao.nomes.join("\n")} onChange={(e) => setImportacao({ ...importacao, nomes: e.target.value.split("\n").map((n) => n.trim()).filter(Boolean) })} />
          <div><button type="button" onClick={confirmarImportacao} disabled={importando}>{importando ? "Importando..." : "Confirmar importação"}</button><button type="button" disabled={importando} onClick={() => setImportacao({ aberta: false, turmaId: "", turno: "", nomes: [] })}>Cancelar</button></div>
        </div>
      )}

      <section className="filtro-turmas-alunos">
        <div className="filtro-turmas-cabecalho">
          <div><h3>Selecionar turmas</h3><p>Marque uma turma para consultar ou várias para comparar.</p></div>
          <div><button type="button" onClick={() => setTurmasSelecionadas(turmasAtivas.map((turma) => turma.id))}>Selecionar todas</button><button type="button" onClick={() => setTurmasSelecionadas([])}>Limpar seleção</button></div>
        </div>
        <div className="filtro-turmas-opcoes">
          {turmasAtivas.map((turma) => (
            <label key={turma.id}>
              <input type="checkbox" checked={turmasSelecionadas.includes(turma.id)} onChange={() => alternarTurmaSelecionada(turma.id)} />
              <span>{turma.codigo}</span><small>{turma.turno || "Sem turno"}</small>
            </label>
          ))}
        </div>
      </section>

      {comparativo.length > 0 && (
        <section className="comparativo-turmas" aria-label="Comparação das turmas selecionadas">
          {comparativo.map((item) => <article key={item.id}><strong>{item.codigo}</strong><span>{item.total} aluno(s)</span><small>{item.ativos} ativos · {item.inativos} inativos</small><b>{item.ocorrencias} ocorrência(s)</b></article>)}
        </section>
      )}

      {turmasSelecionadas.length > 0 && <label className="mostrar-arquivados"><input type="checkbox" checked={mostrarArquivados} onChange={(e) => setMostrarArquivados(e.target.checked)} /> Mostrar alunos arquivados das turmas selecionadas</label>}
      <div className="gestao-alunos-lista">
        {turmasSelecionadas.length === 0 ? (
          <div className="gestao-alunos-vazio">Selecione uma ou mais turmas para visualizar os alunos.</div>
        ) : alunosVisiveis.length === 0 ? (
          <div className="gestao-alunos-vazio">Nenhum aluno encontrado nas turmas selecionadas.</div>
        ) : alunosVisiveis.map((aluno) => (
          <article key={aluno.id} className={aluno.status === "inativo" ? "aluno-inativo" : ""}>
            <div><strong>{aluno.nome}</strong><span>{aluno.turma} · {aluno.turno} · {aluno.arquivadoEm ? "Arquivado" : aluno.status}</span><b>{ocorrenciasPorAluno.get(normalizar(aluno.nome)) || 0} ocorrência(s) no histórico</b></div>
            {!aluno.arquivadoEm && <div><button type="button" onClick={() => setForm({ id: aluno.id, nome: aluno.nome, turmaId: aluno.turmaId, turno: aluno.turno })}>Editar/transferir</button><button type="button" onClick={() => alternarStatus(aluno)}>{aluno.status === "ativo" ? "Inativar" : "Ativar"}</button><button type="button" onClick={() => arquivar(aluno)}>Excluir</button></div>}
          </article>
        ))}
      </div>
    </section>
  );
}

export default GestaoAlunos;

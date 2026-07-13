import "./GestaoAlunos.css";

import { useMemo, useState } from "react";
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

function GestaoAlunos({ user, turmas, alunos, setAlunos, salvarLocais, usarSupabase }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [mostrarArquivados, setMostrarArquivados] = useState(false);
  const [importacao, setImportacao] = useState({ aberta: false, turmaId: "", turno: "", nomes: [] });
  const [importando, setImportando] = useState(false);
  const [mensagem, setMensagem] = useMensagemComAlerta();

  const turmaSelecionada = turmas.find((turma) => turma.id === form.turmaId);
  const alunosVisiveis = useMemo(
    () => alunos.filter((aluno) => mostrarArquivados || !aluno.arquivadoEm),
    [alunos, mostrarArquivados],
  );

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

    const duplicado = alunos.some(
      (aluno) =>
        aluno.id !== form.id &&
        !aluno.arquivadoEm &&
        aluno.turmaId === form.turmaId &&
        aluno.nome.toLocaleLowerCase("pt-BR") ===
          form.nome.trim().toLocaleLowerCase("pt-BR"),
    );
    if (duplicado) {
      setMensagem("Este aluno ja esta cadastrado nesta turma.");
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
      setMensagem(form.id ? "Aluno atualizado ou transferido com sucesso." : "Aluno cadastrado com sucesso.");
      setForm(FORM_INICIAL);
    } catch (error) {
      setMensagem(error.message);
    }
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
    const existentes = new Set(
      alunos
        .filter((aluno) => aluno.turmaId === importacao.turmaId && !aluno.arquivadoEm)
        .map((aluno) => aluno.nome.toLocaleLowerCase("pt-BR")),
    );
    const novos = importacao.nomes
      .filter((nome) => !existentes.has(nome.toLocaleLowerCase("pt-BR")))
      .map((nome) => ({
      nome,
      turmaId: importacao.turmaId,
      turma: turma?.codigo || "",
      turno: importacao.turno,
      status: "ativo",
      }));
    if (novos.length === 0) {
      setMensagem("Todos os nomes da importacao ja estao cadastrados nesta turma.");
      return;
    }
    try {
      setImportando(true);
      const salvos = usarSupabase
        ? await importarAlunosSupabase(user, novos)
        : novos.map((aluno) => ({ ...aluno, id: crypto.randomUUID() }));
      atualizarLista([...alunos, ...salvos].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
      setImportacao({ aberta: false, turmaId: "", turno: "", nomes: [] });
      setMensagem(`${salvos.length} alunos importados com sucesso.`);
    } catch (error) {
      setMensagem(error.message);
    } finally {
      setImportando(false);
    }
  }

  return (
    <section className="gestao-alunos">
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

      <label className="mostrar-arquivados"><input type="checkbox" checked={mostrarArquivados} onChange={(e) => setMostrarArquivados(e.target.checked)} /> Mostrar arquivados</label>
      <div className="gestao-alunos-lista">
        {alunosVisiveis.map((aluno) => (
          <article key={aluno.id} className={aluno.status === "inativo" ? "aluno-inativo" : ""}>
            <div><strong>{aluno.nome}</strong><span>{aluno.turma} · {aluno.turno} · {aluno.arquivadoEm ? "Arquivado" : aluno.status}</span></div>
            {!aluno.arquivadoEm && <div><button type="button" onClick={() => setForm({ id: aluno.id, nome: aluno.nome, turmaId: aluno.turmaId, turno: aluno.turno })}>Editar/transferir</button><button type="button" onClick={() => alternarStatus(aluno)}>{aluno.status === "ativo" ? "Inativar" : "Ativar"}</button><button type="button" onClick={() => arquivar(aluno)}>Excluir</button></div>}
          </article>
        ))}
      </div>
    </section>
  );
}

export default GestaoAlunos;

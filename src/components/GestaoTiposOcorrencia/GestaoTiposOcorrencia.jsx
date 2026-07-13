import "./GestaoTiposOcorrencia.css";

import { useEffect, useMemo, useState } from "react";

import {
  atualizarStatusTipoOcorrenciaSupabase,
  criarTipoOcorrenciaSupabase,
  listarTiposOcorrenciaSupabase,
} from "../../services/cadastrosEscolaresService";
import { useMensagemComAlerta } from "../../hooks/useMensagemComAlerta";

const TIPOS_PADRAO = [
  "Indisciplina",
  "Atraso",
  "Falta de material",
  "Desrespeito",
  "Briga",
  "Uso de celular",
  "Outro",
];

function chaveLocal(escolaId) {
  return `tiposOcorrencia:${escolaId}`;
}

function GestaoTiposOcorrencia({ user }) {
  const [tipos, setTipos] = useState([]);
  const [novoTipo, setNovoTipo] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useMensagemComAlerta();
  const usarSupabase = user?.origem === "supabase";

  useEffect(() => {
    let ativo = true;

    if (usarSupabase) {
      listarTiposOcorrenciaSupabase(user)
        .then((dados) => { if (ativo) setTipos(dados); })
        .catch(() => { if (ativo) setMensagem("Nao foi possivel carregar os tipos de ocorrencia."); });
    } else {
      const salvos = JSON.parse(localStorage.getItem(chaveLocal(user.escolaId)) || "null");
      queueMicrotask(() => {
        if (ativo) {
          setTipos(salvos || TIPOS_PADRAO.map((nome) => ({ id: nome, nome, status: "ativo" })));
        }
      });
    }

    return () => { ativo = false; };
  }, [setMensagem, usarSupabase, user]);

  const tiposVisiveis = useMemo(
    () => tipos.filter((tipo) => mostrarInativos || tipo.status !== "inativo"),
    [mostrarInativos, tipos],
  );

  function atualizarLista(proximos) {
    setTipos(proximos);
    if (!usarSupabase) {
      localStorage.setItem(chaveLocal(user.escolaId), JSON.stringify(proximos));
    }
  }

  async function adicionar(event) {
    event.preventDefault();
    const nome = novoTipo.trim();
    if (!nome || salvando) {
      if (!nome) setMensagem("Informe o nome do tipo de ocorrencia.");
      return;
    }

    const existente = tipos.find(
      (tipo) => tipo.nome.toLocaleLowerCase("pt-BR") === nome.toLocaleLowerCase("pt-BR"),
    );
    if (existente?.status !== "inativo") {
      setMensagem("Este tipo de ocorrencia ja esta ativo.");
      return;
    }

    setSalvando(true);
    try {
      if (existente) {
        const reativado = usarSupabase
          ? await atualizarStatusTipoOcorrenciaSupabase(existente.id, "ativo", user)
          : { ...existente, status: "ativo" };
        atualizarLista(tipos.map((tipo) => tipo.id === existente.id ? reativado : tipo));
        setMensagem("Tipo de ocorrencia reativado com sucesso.");
      } else {
        const criado = usarSupabase
          ? await criarTipoOcorrenciaSupabase(user, nome)
          : { id: crypto.randomUUID(), nome, status: "ativo" };
        atualizarLista([...tipos, criado].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")));
        setMensagem("Tipo de ocorrencia adicionado com sucesso.");
      }
      setNovoTipo("");
    } catch (error) {
      setMensagem(error.message);
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(tipo) {
    if (salvando) return;
    const status = tipo.status === "inativo" ? "ativo" : "inativo";
    setSalvando(true);
    try {
      const atualizado = usarSupabase
        ? await atualizarStatusTipoOcorrenciaSupabase(tipo.id, status, user)
        : { ...tipo, status };
      atualizarLista(tipos.map((item) => item.id === tipo.id ? atualizado : item));
      setMensagem(`Tipo de ocorrencia ${status === "ativo" ? "ativado" : "inativado"} com sucesso.`);
    } catch (error) {
      setMensagem(error.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="config-card gestao-tipos-ocorrencia">
      <div className="gestao-tipos-cabecalho">
        <div><h2>Tipos de ocorrência</h2><p>Defina quais opções aparecem no registro de novas ocorrências.</p></div>
        <label><input type="checkbox" checked={mostrarInativos} onChange={(event) => setMostrarInativos(event.target.checked)} /> Mostrar inativos</label>
      </div>
      {mensagem && <div className="mensagem-config">{mensagem}</div>}
      <form onSubmit={adicionar} className="gestao-tipos-form">
        <input value={novoTipo} onChange={(event) => setNovoTipo(event.target.value)} placeholder="Ex: Falta de uniforme" />
        <button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Adicionar tipo"}</button>
      </form>
      <div className="gestao-tipos-lista">
        {tiposVisiveis.map((tipo) => (
          <article key={tipo.id} className={tipo.status === "inativo" ? "tipo-inativo" : ""}>
            <div><strong>{tipo.nome}</strong><span>{tipo.status === "inativo" ? "Inativo" : "Ativo"}</span></div>
            <button type="button" disabled={salvando} onClick={() => alternarStatus(tipo)}>{tipo.status === "inativo" ? "Ativar" : "Inativar"}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default GestaoTiposOcorrencia;

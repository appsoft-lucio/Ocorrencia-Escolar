import { supabase } from "./supabaseClient";

function mapearEscola(row) {
  return {
    id: row.id,
    nome: row.nome,
    cidade: row.cidade || "",
    status: row.status || "ativo",
    diretorNome: row.diretorNome || row.diretor_nome || "",
    diretorLogin: row.diretorLogin || row.diretor_login || "",
    diretorSenha: "",
    criadoEm: row.created_at || null,
    atualizadoEm: row.updated_at || null,
    origem: "supabase",
  };
}

export async function listarEscolasSupabase() {
  const { data, error } = await supabase
    .from("escolas")
    .select("id, nome, cidade, status, created_at, updated_at")
    .order("nome", { ascending: true });

  if (error) {
    throw new Error("Nao foi possivel carregar escolas.");
  }

  const escolas = data || [];
  const escolaIds = escolas.map((escola) => escola.id);

  if (escolaIds.length === 0) {
    return [];
  }

  const { data: diretores, error: diretoresError } = await supabase
    .from("perfis")
    .select("escola_id, nome")
    .eq("perfil", "diretor")
    .in("escola_id", escolaIds);

  if (diretoresError) {
    return escolas.map(mapearEscola);
  }

  const diretoresPorEscola = new Map(
    (diretores || []).map((diretor) => [diretor.escola_id, diretor]),
  );

  return escolas.map((escola) =>
    mapearEscola({
      ...escola,
      diretor_nome: diretoresPorEscola.get(escola.id)?.nome || "",
      diretor_login: "",
    }),
  );
}

export async function criarEscolaDirecaoSupabase(dados) {
  const { data, error } = await supabase.functions.invoke("criar-escola-direcao", {
    body: dados,
  });

  if (error) {
    throw new Error(error.message || "Nao foi possivel criar escola.");
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  return mapearEscola(data.escola);
}

export async function atualizarStatusEscolaSupabase(id, status) {
  const { data, error } = await supabase
    .from("escolas")
    .update({ status })
    .eq("id", id)
    .select("id, nome, cidade, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error("Nao foi possivel atualizar a escola.");
  }

  return mapearEscola(data);
}

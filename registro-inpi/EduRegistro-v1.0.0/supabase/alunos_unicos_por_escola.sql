-- Execute primeiro a consulta de verificacao abaixo. Ela deve retornar zero linhas.
select
  e.nome as escola,
  lower(btrim(a.nome)) as nome_normalizado,
  count(*) as quantidade,
  string_agg(coalesce(t.codigo, 'Sem turma'), ', ' order by t.codigo) as turmas
from public.alunos a
join public.escolas e on e.id = a.escola_id
left join public.turmas t on t.id = a.turma_id
where a.arquivado_em is null
group by e.nome, a.escola_id, lower(btrim(a.nome))
having count(*) > 1
order by e.nome, nome_normalizado;

-- Se a consulta acima retornar alunos, resolva as duplicacoes antes de continuar.
-- A aplicacao nao escolhe automaticamente qual turma deve ser mantida.

do $$
begin
  if exists (
    select 1
    from public.alunos
    where arquivado_em is null
    group by escola_id, lower(btrim(nome))
    having count(*) > 1
  ) then
    raise exception
      'Existem alunos duplicados na mesma escola. Resolva-os antes de criar a regra unica.';
  end if;
end;
$$;

drop index if exists public.alunos_nome_turma_ativos_unique_idx;

create unique index if not exists alunos_nome_escola_ativos_unique_idx
on public.alunos(escola_id, lower(btrim(nome)))
where arquivado_em is null;

alter table public.escolas
add column if not exists permitir_importacao_alunos boolean not null default false;

alter table public.alunos
add column if not exists turno text;

alter table public.alunos
add column if not exists arquivado_em timestamptz;

create index if not exists alunos_turma_status_idx
on public.alunos(turma_id, status);

-- Arquiva copias existentes sem remover o historico e impede novas duplicacoes.
with alunos_repetidos as (
  select
    id,
    row_number() over (
      partition by escola_id, turma_id, lower(btrim(nome))
      order by created_at, id
    ) as repeticao
  from public.alunos
  where arquivado_em is null
)
update public.alunos as aluno
set status = 'inativo', arquivado_em = now()
from alunos_repetidos
where aluno.id = alunos_repetidos.id
  and alunos_repetidos.repeticao > 1;

create unique index if not exists alunos_nome_turma_ativos_unique_idx
on public.alunos(escola_id, turma_id, lower(btrim(nome)))
where arquivado_em is null;

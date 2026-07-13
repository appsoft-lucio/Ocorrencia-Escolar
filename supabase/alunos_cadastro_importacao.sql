alter table public.escolas
add column if not exists permitir_importacao_alunos boolean not null default false;

alter table public.alunos
add column if not exists turno text;

alter table public.alunos
add column if not exists arquivado_em timestamptz;

create index if not exists alunos_turma_status_idx
on public.alunos(turma_id, status);

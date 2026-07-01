-- EduRegistro / Ocorrencia Escolar
-- Execute este arquivo no SQL Editor do Supabase depois de criar o projeto.

create extension if not exists "pgcrypto";

create type public.perfil_usuario as enum (
  'desenvolvedor',
  'diretor',
  'vice_diretor',
  'coordenador',
  'professor'
);

create type public.status_registro as enum ('ativo', 'inativo');

create table public.escolas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cidade text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  escola_id uuid references public.escolas(id) on delete set null,
  nome text not null,
  perfil public.perfil_usuario not null,
  whatsapp text,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint perfil_escola_obrigatoria check (
    perfil = 'desenvolvedor' or escola_id is not null
  )
);

create table public.turmas (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on delete cascade,
  codigo text not null,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (escola_id, codigo)
);

create table public.tipos_ocorrencia (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on delete cascade,
  nome text not null,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (escola_id, nome)
);

create table public.alunos (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on delete cascade,
  nome text not null,
  turma_id uuid references public.turmas(id) on delete set null,
  status public.status_registro not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ocorrencias (
  id uuid primary key default gen_random_uuid(),
  escola_id uuid not null references public.escolas(id) on delete cascade,
  professor_id uuid references public.perfis(id) on delete set null,
  professor_nome text not null,
  alunos text[] not null default '{}',
  disciplina text not null,
  turno text not null,
  turma text not null,
  horario text,
  tipos text[] not null default '{}',
  observacao text,
  status text not null default 'Pendente',
  status_atualizado_por text,
  status_atualizado_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index escolas_status_idx on public.escolas(status);
create index perfis_escola_id_idx on public.perfis(escola_id);
create index perfis_perfil_idx on public.perfis(perfil);
create index turmas_escola_id_idx on public.turmas(escola_id);
create index tipos_ocorrencia_escola_id_idx on public.tipos_ocorrencia(escola_id);
create index alunos_escola_id_idx on public.alunos(escola_id);
create index ocorrencias_escola_id_idx on public.ocorrencias(escola_id);
create index ocorrencias_professor_id_idx on public.ocorrencias(professor_id);
create index ocorrencias_created_at_idx on public.ocorrencias(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_escolas_updated_at
before update on public.escolas
for each row execute function public.set_updated_at();

create trigger set_perfis_updated_at
before update on public.perfis
for each row execute function public.set_updated_at();

create trigger set_turmas_updated_at
before update on public.turmas
for each row execute function public.set_updated_at();

create trigger set_tipos_ocorrencia_updated_at
before update on public.tipos_ocorrencia
for each row execute function public.set_updated_at();

create trigger set_alunos_updated_at
before update on public.alunos
for each row execute function public.set_updated_at();

create trigger set_ocorrencias_updated_at
before update on public.ocorrencias
for each row execute function public.set_updated_at();

create or replace function public.perfil_atual()
returns public.perfil_usuario
language sql
security definer
stable
set search_path = public
as $$
  select perfil from public.perfis where id = auth.uid() and status = 'ativo'
$$;

create or replace function public.escola_atual()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select escola_id from public.perfis where id = auth.uid() and status = 'ativo'
$$;

create or replace function public.eh_desenvolvedor()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.perfil_atual() = 'desenvolvedor', false)
$$;

create or replace function public.eh_gestao()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.perfil_atual() in ('diretor', 'vice_diretor', 'coordenador'), false)
$$;

alter table public.escolas enable row level security;
alter table public.perfis enable row level security;
alter table public.turmas enable row level security;
alter table public.tipos_ocorrencia enable row level security;
alter table public.alunos enable row level security;
alter table public.ocorrencias enable row level security;

create policy "desenvolvedor gerencia escolas"
on public.escolas
for all
to authenticated
using (public.eh_desenvolvedor())
with check (public.eh_desenvolvedor());

create policy "usuarios veem sua escola"
on public.escolas
for select
to authenticated
using (id = public.escola_atual() or public.eh_desenvolvedor());

create policy "usuario ve o proprio perfil"
on public.perfis
for select
to authenticated
using (id = auth.uid());

create policy "desenvolvedor gerencia perfis"
on public.perfis
for all
to authenticated
using (public.eh_desenvolvedor())
with check (public.eh_desenvolvedor());

create policy "gestao ve perfis da escola"
on public.perfis
for select
to authenticated
using (
  public.eh_gestao()
  and escola_id = public.escola_atual()
);

create policy "gestao atualiza status de professores"
on public.perfis
for update
to authenticated
using (
  public.eh_gestao()
  and escola_id = public.escola_atual()
  and perfil = 'professor'
)
with check (
  public.eh_gestao()
  and escola_id = public.escola_atual()
  and perfil = 'professor'
);

create policy "turmas da escola"
on public.turmas
for select
to authenticated
using (escola_id = public.escola_atual() or public.eh_desenvolvedor());

create policy "gestao gerencia turmas"
on public.turmas
for all
to authenticated
using (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
)
with check (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
);

create policy "tipos da escola"
on public.tipos_ocorrencia
for select
to authenticated
using (escola_id = public.escola_atual() or public.eh_desenvolvedor());

create policy "gestao gerencia tipos"
on public.tipos_ocorrencia
for all
to authenticated
using (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
)
with check (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
);

create policy "alunos da escola"
on public.alunos
for select
to authenticated
using (escola_id = public.escola_atual() or public.eh_desenvolvedor());

create policy "gestao gerencia alunos"
on public.alunos
for all
to authenticated
using (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
)
with check (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
);

create policy "ocorrencias visiveis"
on public.ocorrencias
for select
to authenticated
using (
  public.eh_desenvolvedor()
  or (
    escola_id = public.escola_atual()
    and (
      public.eh_gestao()
      or professor_id = auth.uid()
    )
  )
);

create policy "professor cria ocorrencia da escola"
on public.ocorrencias
for insert
to authenticated
with check (
  escola_id = public.escola_atual()
  and professor_id = auth.uid()
);

create policy "gestao atualiza ocorrencias da escola"
on public.ocorrencias
for update
to authenticated
using (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
)
with check (
  public.eh_desenvolvedor()
  or (public.eh_gestao() and escola_id = public.escola_atual())
);

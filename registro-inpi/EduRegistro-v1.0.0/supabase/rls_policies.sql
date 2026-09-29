-- EduRegistro / Ocorrencia Escolar
-- Execute no SQL Editor do Supabase para atualizar as policies de RLS.
-- Este arquivo e idempotente: pode ser executado mais de uma vez.

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

create or replace function public.email_por_usuario(usuario_login text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(auth_email, email)
  from public.perfis
  where lower(login) = lower(trim(usuario_login))
    and status = 'ativo'
  limit 1
$$;

grant execute on function public.email_por_usuario(text) to anon;
grant execute on function public.email_por_usuario(text) to authenticated;

alter table public.escolas enable row level security;
alter table public.perfis enable row level security;
alter table public.turmas enable row level security;
alter table public.tipos_ocorrencia enable row level security;
alter table public.alunos enable row level security;
alter table public.ocorrencias enable row level security;

drop policy if exists "desenvolvedor gerencia escolas" on public.escolas;
drop policy if exists "usuarios veem sua escola" on public.escolas;
drop policy if exists "usuario ve o proprio perfil" on public.perfis;
drop policy if exists "gestao gerencia perfis da escola" on public.perfis;
drop policy if exists "desenvolvedor gerencia perfis" on public.perfis;
drop policy if exists "gestao ve perfis da escola" on public.perfis;
drop policy if exists "gestao atualiza status de professores" on public.perfis;
drop policy if exists "turmas da escola" on public.turmas;
drop policy if exists "gestao gerencia turmas" on public.turmas;
drop policy if exists "tipos da escola" on public.tipos_ocorrencia;
drop policy if exists "gestao gerencia tipos" on public.tipos_ocorrencia;
drop policy if exists "alunos da escola" on public.alunos;
drop policy if exists "gestao gerencia alunos" on public.alunos;
drop policy if exists "ocorrencias visiveis" on public.ocorrencias;
drop policy if exists "professor cria ocorrencia da escola" on public.ocorrencias;
drop policy if exists "gestao atualiza ocorrencias da escola" on public.ocorrencias;

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

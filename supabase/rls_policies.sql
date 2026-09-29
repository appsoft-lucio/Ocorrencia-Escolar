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

-- Restricoes adicionais: combinadas com AND com todas as policies existentes.
create or replace function public.normalizar_turno(valor text)
returns text language sql immutable set search_path = public
as $$ select lower(translate(btrim(coalesce(valor, '')), 'ãáàâÃÁÀÂ', 'aaaaAAAA')) $$;

create or replace function public.pode_acessar_turno(turno_registro text)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((
    select case when perfil in ('vice_diretor', 'coordenador') then
      public.normalizar_turno(turno) in ('manha', 'tarde', 'noite')
      and public.normalizar_turno(turno) = public.normalizar_turno(turno_registro)
    else true end
    from public.perfis where id = auth.uid() and status = 'ativo'
  ), false)
$$;

drop policy if exists "restricao de turno" on public.turmas;
create policy "restricao de turno" on public.turmas
as restrictive for all to authenticated
using (public.pode_acessar_turno(turno)) with check (public.pode_acessar_turno(turno));

drop policy if exists "restricao de turno" on public.alunos;
create policy "restricao de turno" on public.alunos
as restrictive for all to authenticated
using (public.pode_acessar_turno(coalesce(nullif(turno, ''), (select t.turno from public.turmas t where t.id = turma_id)))) with check (public.pode_acessar_turno(coalesce(nullif(turno, ''), (select t.turno from public.turmas t where t.id = turma_id))));

drop policy if exists "restricao de turno" on public.ocorrencias;
create policy "restricao de turno" on public.ocorrencias
as restrictive for all to authenticated
using (public.pode_acessar_turno(turno)) with check (public.pode_acessar_turno(turno));

drop policy if exists "restricao de turno" on public.perfis;
create policy "restricao de turno" on public.perfis
as restrictive for all to authenticated
using ((id = auth.uid() or public.pode_acessar_turno(turno))) with check ((id = auth.uid() or public.pode_acessar_turno(turno)));

-- NOT VALID preserva contas antigas sem turno, mas valida novas gravacoes.
alter table public.perfis drop constraint if exists gestao_turno_obrigatorio;
alter table public.perfis add constraint gestao_turno_obrigatorio check (
  perfil not in ('vice_diretor', 'coordenador')
  or public.normalizar_turno(turno) in ('manha', 'tarde', 'noite')
) not valid;

-- Somente a direcao pode regularizar/mudar o turno de gestores da propria escola.
create or replace function public.definir_turno_gestao(usuario_id uuid, novo_turno text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if public.perfil_atual() is distinct from 'diretor'::public.perfil_usuario then
    raise exception 'Somente a direcao pode definir o turno da gestao.';
  end if;
  if public.normalizar_turno(novo_turno) not in ('manha', 'tarde', 'noite') then
    raise exception 'Informe manha, tarde ou noite.';
  end if;
  update public.perfis set turno = case public.normalizar_turno(novo_turno)
    when 'manha' then 'Manha' when 'tarde' then 'Tarde' else 'Noite' end
  where id = usuario_id and escola_id = public.escola_atual()
    and perfil in ('vice_diretor', 'coordenador');
  if not found then raise exception 'Usuario nao encontrado ou sem permissao.'; end if;
end;
$$;
revoke all on function public.definir_turno_gestao(uuid, text) from public;
grant execute on function public.definir_turno_gestao(uuid, text) to authenticated;

-- Professor acessa somente turmas explicitamente vinculadas, sem turno proprio.
create or replace function public.pode_acessar_turma(codigo_turma text)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((select case when p.perfil = 'professor' then
    exists (select 1 from public.turmas t where t.escola_id = p.escola_id
      and t.codigo = codigo_turma and t.codigo = any(p.turmas) and t.status = 'ativo')
    else true end
    from public.perfis p where p.id = auth.uid() and p.status = 'ativo'), false)
$$;

create or replace function public.pode_acessar_perfil_por_turmas(perfil_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((select case
    when p.id = auth.uid() then true
    when p.perfil = 'professor' then exists (
      select 1 from public.turmas t where t.escola_id = p.escola_id
      and t.codigo = any(p.turmas) and public.pode_acessar_turno(t.turno))
    else public.pode_acessar_turno(p.turno) end
    from public.perfis p where p.id = perfil_id), false)
$$;

-- A direcao mantem acesso aos professores ainda sem turmas.
drop policy if exists "restricao de turno" on public.perfis;
create policy "restricao de turno" on public.perfis
as restrictive for all to authenticated
using (public.perfil_atual() not in ('vice_diretor', 'coordenador') or public.pode_acessar_perfil_por_turmas(id))
with check (public.perfil_atual() not in ('vice_diretor', 'coordenador') or public.pode_acessar_perfil_por_turmas(id));

drop policy if exists "professor restrito as turmas" on public.turmas;
create policy "professor restrito as turmas" on public.turmas
as restrictive for all to authenticated
using (public.pode_acessar_turma(codigo)) with check (public.pode_acessar_turma(codigo));

drop policy if exists "professor restrito as turmas" on public.alunos;
create policy "professor restrito as turmas" on public.alunos
as restrictive for all to authenticated
using (public.perfil_atual() <> 'professor' or exists (
  select 1 from public.turmas t where t.id = turma_id and public.pode_acessar_turma(t.codigo)))
with check (public.perfil_atual() <> 'professor');

drop policy if exists "professor restrito as turmas" on public.ocorrencias;
create policy "professor restrito as turmas" on public.ocorrencias
as restrictive for all to authenticated
using (public.pode_acessar_turma(turma))
with check (public.pode_acessar_turma(turma) and (
  public.perfil_atual() <> 'professor' or exists (
    select 1 from public.turmas t where t.escola_id = ocorrencias.escola_id
      and t.codigo = ocorrencias.turma
      and public.normalizar_turno(t.turno) = public.normalizar_turno(ocorrencias.turno))));

-- Valida tambem edicoes diretas e preserva vinculos de outros turnos.
create or replace function public.validar_turmas_professor()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  codigos_anteriores text[] := '{}';
  restrito boolean := coalesce(public.perfil_atual() in ('vice_diretor', 'coordenador'), false);
begin
  if new.perfil <> 'professor' then return new; end if;
  new.turno := null;
  if tg_op = 'UPDATE' then codigos_anteriores := old.turmas; end if;
  if exists (
    select 1 from unnest(new.turmas) as vinculo(codigo)
    where not (vinculo.codigo = any(codigos_anteriores)) and not exists (
      select 1 from public.turmas t where t.escola_id = new.escola_id
        and t.codigo = vinculo.codigo and t.status = 'ativo'
        and (not restrito or public.pode_acessar_turno(t.turno))
    )
  ) then raise exception 'Vincule somente turmas ativas e permitidas da escola.'; end if;
  if restrito and tg_op = 'UPDATE' then
    new.turmas := array(select distinct codigo from (
      select unnest(new.turmas) codigo
      union
      select t.codigo from public.turmas t where t.escola_id = old.escola_id
        and t.codigo = any(old.turmas) and not public.pode_acessar_turno(t.turno)
    ) vinculos);
  end if;
  return new;
end;
$$;
drop trigger if exists validar_turmas_professor on public.perfis;
create trigger validar_turmas_professor before insert or update on public.perfis
for each row execute function public.validar_turmas_professor();

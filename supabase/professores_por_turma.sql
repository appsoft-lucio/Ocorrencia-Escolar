-- Execute depois de restricao_turnos.sql em bases existentes.
begin;
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

commit;

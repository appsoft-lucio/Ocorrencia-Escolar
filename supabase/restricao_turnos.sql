-- Aplicar em bases existentes antes de publicar o frontend e a Edge Function.
begin;

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

commit;

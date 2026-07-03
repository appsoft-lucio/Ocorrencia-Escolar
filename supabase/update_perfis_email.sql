-- EduRegistro / Ocorrencia Escolar
-- Execute uma vez no SQL Editor do Supabase para permitir salvar usuario e email em perfis.

alter table public.perfis
add column if not exists email text;

alter table public.perfis
add column if not exists login text;

alter table public.perfis
add column if not exists auth_email text;

create index if not exists perfis_email_idx
on public.perfis (email);

create unique index if not exists perfis_login_unique_idx
on public.perfis (lower(login))
where login is not null;

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

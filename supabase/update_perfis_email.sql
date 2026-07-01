-- EduRegistro / Ocorrencia Escolar
-- Execute uma vez no SQL Editor do Supabase para permitir salvar email em perfis.

alter table public.perfis
add column if not exists email text;

create index if not exists perfis_email_idx
on public.perfis (email);

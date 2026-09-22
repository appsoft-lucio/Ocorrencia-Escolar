alter table public.ocorrencias
  add column if not exists solicitar_responsavel boolean not null default false,
  add column if not exists responsavel_compareceu boolean not null default false,
  add column if not exists responsavel_compareceu_por text,
  add column if not exists responsavel_compareceu_em timestamptz;

create index if not exists ocorrencias_responsavel_pendente_idx
  on public.ocorrencias(escola_id, solicitar_responsavel, responsavel_compareceu)
  where solicitar_responsavel = true and responsavel_compareceu = false;

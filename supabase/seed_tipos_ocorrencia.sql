-- Cria os tipos padrao em todas as escolas sem duplicar os ja existentes.
insert into public.tipos_ocorrencia (escola_id, nome, status)
select escola.id, tipo.nome, 'ativo'::public.status_registro
from public.escolas as escola
cross join (
  values
    ('Indisciplina'),
    ('Atraso'),
    ('Falta de material'),
    ('Desrespeito'),
    ('Agressão verbal'),
    ('Agressão física'),
    ('Briga'),
    ('Bullying'),
    ('Uso indevido de celular'),
    ('Saída da sala sem autorização'),
    ('Dano ao patrimônio'),
    ('Recusa em realizar atividade'),
    ('Outro')
) as tipo(nome)
where not exists (
  select 1
  from public.tipos_ocorrencia existente
  where existente.escola_id = escola.id
    and lower(btrim(existente.nome)) = lower(btrim(tipo.nome))
);

-- Reativa a opcao Outro, pois ela deve estar sempre disponivel no registro.
update public.tipos_ocorrencia
set status = 'ativo'
where lower(btrim(nome)) = lower('Outro');

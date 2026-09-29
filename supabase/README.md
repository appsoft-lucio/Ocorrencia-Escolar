# Supabase

Este diretorio guarda a base do backend do EduRegistro.

## Passos

1. Crie um projeto gratuito no Supabase.
2. Abra `SQL Editor`.
3. Cole e execute o conteudo de `schema.sql`.
4. Se o projeto ja existe, execute tambem `rls_policies.sql` para atualizar as regras de seguranca sem recriar tabelas.
5. Em `Project Settings > API`, copie:
   - `Project URL`
   - `anon public`
6. Na Vercel, adicione as variaveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Use somente a chave `anon public` no frontend. Nunca coloque a chave
`service_role` na Vercel do frontend ou no codigo do navegador.

## Seguranca

O schema ativa Row Level Security em todas as tabelas principais. As policies
separam os dados por escola e perfil:

- desenvolvedor gerencia escolas e perfis;
- direcao/coordenacao gerenciam dados da propria escola;
- professor cria e consulta suas proprias ocorrencias;
- usuarios nao autenticados nao acessam dados.

`rls_policies.sql` mantem as policies atuais em um arquivo separado e
idempotente. Ele e o arquivo indicado para aplicar ajustes de seguranca em um
projeto Supabase que ja esta em uso.

## Edge Functions

A funcao `criar-usuario-escola` cria o login no Supabase Auth e o perfil na
tabela `perfis`. Ela precisa ser publicada no Supabase antes da tela
`Usuarios` criar acessos reais pela rede.

Secrets necessarios na funcao:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend ou na Vercel do app.
Essa chave deve ficar somente nos secrets da Edge Function.

## Separacao por turno

Em bases existentes, execute `restricao_turnos.sql` e publique novamente a Edge
Function `criar-usuario-escola`, antes de publicar o frontend. Novas bases ja
incluem essas regras em `schema.sql`; `rls_policies.sql` tambem as preserva.
Supervisao e vice-direcao exigem Manha, Tarde ou Noite. As policies restritivas
limitam leitura e escrita de perfis, alunos, turmas e ocorrencias ao turno.
Contas antigas sem turno nao acessam esses dados ate a direcao definir seu turno
na lista de usuarios. Nenhum turno e atribuido automaticamente. Tipos de ocorrencia
e dados cadastrais da escola continuam compartilhados.

## Professores por turma

Depois de `restricao_turnos.sql`, execute `professores_por_turma.sql` e publique
novamente `criar-usuario-escola` e o frontend. O professor nao possui mais turno
proprio: vincule turmas cadastradas, inclusive de turnos diferentes. Sem vinculo,
nao ha acesso a alunos, turmas ou ocorrencias. Ocorrencias continuam restritas ao
proprio autor, agora tambem exigindo vinculo com a turma. O turno da ocorrencia
deve corresponder ao da turma. Vinculos nao sao inferidos do historico.
A supervisao e vice-direcao vinculam apenas turmas do proprio turno; edicoes
preservam vinculos existentes de outros turnos. O professor precisa entrar
novamente apos mudancas de vinculo para atualizar os filtros da interface;
o banco aplica as permissoes atuais em cada requisicao.

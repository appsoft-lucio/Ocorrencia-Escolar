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

# Supabase

Este diretório guarda a base do backend do EduRegistro.

## Passos

1. Crie um projeto gratuito no Supabase.
2. Abra `SQL Editor`.
3. Cole e execute o conteúdo de `schema.sql`.
4. Em `Project Settings > API`, copie:
   - `Project URL`
   - `anon public`
5. Na Vercel, adicione as variáveis:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

Use somente a chave `anon public` no frontend. Nunca coloque a chave
`service_role` na Vercel do frontend ou no código do navegador.

## Segurança

O schema ativa Row Level Security em todas as tabelas principais. As políticas
separam os dados por escola e perfil:

- desenvolvedor gerencia escolas;
- direção/coordenação gerenciam dados da própria escola;
- professor cria e consulta suas próprias ocorrências;
- usuários não autenticados não acessam dados.

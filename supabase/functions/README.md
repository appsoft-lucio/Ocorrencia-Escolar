# Edge Functions

Este diretorio guarda as funcoes Supabase usadas como API segura do sistema.

## Funcao `criar-usuario-escola`

Cria um usuario real no Supabase Auth e tambem cria o registro correspondente
na tabela `perfis`.

Use essa funcao para a direcao/coordenacao cadastrar professores e outros
usuarios da escola pelo app.

## Publicar no Supabase

1. Abra o Supabase.
2. Entre no projeto `ocorrencia-escolar`.
3. Copie o `Project Ref` em `Project Settings > General`.
4. No terminal, dentro da raiz do projeto, faca login no Supabase CLI:

```powershell
npx supabase@latest login
```

5. Publique a funcao:

```powershell
npx supabase@latest functions deploy criar-usuario-escola --project-ref SEU_PROJECT_REF
```

Troque `SEU_PROJECT_REF` pelo Project Ref do Supabase.

## Secrets

A funcao usa estes secrets:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

O Supabase costuma disponibilizar esses secrets automaticamente nas Edge
Functions. Se a funcao acusar ambiente incompleto, confira em:

`Project Settings > Edge Functions > Secrets`

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend, no `.env` do Vite ou na
Vercel do app. Ela deve ficar somente no ambiente da Edge Function.

## Teste esperado

Depois do deploy:

1. Entre no app como direcao ou coordenacao usando login Supabase.
2. Abra `Usuarios`.
3. Cadastre um professor com email e senha.
4. Saia do app.
5. Entre com o email e senha do professor.

O professor deve entrar no sistema e visualizar somente os dados permitidos
para o perfil dele.

## Funcao `criar-escola-direcao`

Cria a escola, cria o login da direcao no Supabase Auth e cria o perfil
`diretor` vinculado a essa escola, com email e telefone.

Antes de usar em projeto ja existente, execute no SQL Editor:

```sql
alter table public.perfis add column if not exists email text;
```

Publique com:

```powershell
npx.cmd supabase@latest functions deploy criar-escola-direcao
```

Teste esperado:

1. Entre no app como desenvolvedor Supabase.
2. Abra `Escolas`.
3. Cadastre uma escola informando email, telefone e senha da direcao.
4. Saia do app.
5. Entre com o email e senha da direcao.

A direcao deve entrar vinculada a escola cadastrada.

## Funcao `excluir-escola`

Exclui uma escola pelo painel do desenvolvedor. Antes de remover a escola, apaga
os usuarios do Supabase Auth vinculados a ela.

Publique com:

```powershell
npx.cmd supabase@latest functions deploy excluir-escola
```

Teste esperado:

1. Entre no app como desenvolvedor Supabase.
2. Abra `Escolas`.
3. Clique em `Excluir` no card de uma escola de teste.
4. Confirme a exclusao.

A escola deve sair da lista e os acessos vinculados a ela devem ser removidos.

# EduRegistro

Aplicativo de acompanhamento e gestão escolar para registrar ocorrências, acompanhar alunos e apoiar decisões da equipe escolar. Os dados e acessos são organizados por escola, perfil, turno e vínculo com turmas.

## Funcionalidades

- Dashboard com indicadores e gráficos de ocorrências.
- Registro e consulta de ocorrências, com acompanhamento de status e comparecimento do responsável conforme as permissões do usuário.
- Cadastro de alunos, turmas e tipos de ocorrência.
- Importação de nomes de alunos por PDF ou texto, com revisão antes de salvar, quando habilitada para a escola. PDFs escaneados podem não ser reconhecidos.
- Gestão de professores, vice-diretores e supervisão.
- Relatórios com filtros e exportação em PDF.
- Gestão de escolas e dos acessos da direção pelo perfil desenvolvedor.
- Login, recuperação de senha, instalação como aplicativo (PWA) em navegadores compatíveis e uso off-line com sincronização.

## Tecnologias

React 19, Vite 8, React Router, Supabase (Auth, PostgreSQL com Row Level Security e Edge Functions), Recharts, jsPDF e PDF.js. O armazenamento off-line usa `localStorage` para dados e fila de alterações, além de service worker para o cache do aplicativo.

## Executar localmente

Use uma versão do Node.js compatível com o Vite 8 e npm.

```bash
npm install
```

Crie `.env.local` na raiz usando [`.env.example`](.env.example) como referência:

```dotenv
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

Configure o backend conforme a seção seguinte e inicie o servidor:

```bash
npm run dev
```

Abra o endereço informado pelo Vite. Reinicie o servidor após alterar as variáveis de ambiente.

Sem as duas variáveis do Supabase, o login usa as contas de demonstração definidas em [`src/data/demoUsers.js`](src/data/demoUsers.js). Esse modo não substitui a validação com autenticação e dados reais do Supabase.

## Configurar o Supabase

Consulte as instruções de [banco e segurança](supabase/README.md) e de [publicação das Edge Functions](supabase/functions/README.md).

1. Crie o projeto Supabase e execute [`supabase/schema.sql`](supabase/schema.sql) no SQL Editor.
2. Confira os scripts complementares em `supabase/`, conforme os recursos e o estado da base. As instruções do backend detalham cadastro/importação de alunos, restrição por turno e professores por turma. Para bases existentes, use também [`rls_policies.sql`](supabase/rls_policies.sql) para atualizar as policies. Leia as condições de cada script antes de aplicá-lo; [`alunos_unicos_por_escola.sql`](supabase/alunos_unicos_por_escola.sql), por exemplo, exige resolver duplicidades previamente.
3. Publique as funções `criar-usuario-escola`, `criar-escola-direcao`, `atualizar-escola-direcao` e `excluir-escola` para habilitar os fluxos administrativos correspondentes.
4. Configure os secrets das funções conforme a documentação do backend.
5. Prepare o acesso inicial no Supabase Auth e o registro correspondente em `perfis`. O painel de escolas exige o perfil `desenvolvedor`; autenticar sem um perfil válido não é suficiente para entrar no app.

Use somente a chave pública `anon` no frontend. A chave `SUPABASE_SERVICE_ROLE_KEY` deve ficar exclusivamente no ambiente das Edge Functions.

## Perfis e permissões

| Perfil | Acesso principal |
| --- | --- |
| Desenvolvedor | Gestão de escolas e dos acessos da direção. |
| Direção | Módulos da escola, incluindo vice-diretores e supervisão. |
| Vice-diretor | Módulos de gestão e cadastro da supervisão, respeitando o turno vinculado. |
| Supervisão/coordenação | Módulos de gestão, respeitando as restrições de turno aplicáveis. |
| Professor | Dashboard, ocorrências, alunos, turmas e configurações, dentro das permissões do perfil. |

O código reconhece `diretor`/`direcao` e `coordenador`/`coordenacao`. A tela de supervisão cadastra o perfil `coordenador`.

Professores precisam estar vinculados às turmas para acessar seus alunos e ocorrências; as ocorrências continuam restritas ao próprio autor. Vice-direção e supervisão precisam de turno definido. Tipos de ocorrência e dados cadastrais da escola são compartilhados conforme as policies. O banco aplica as regras de acesso em cada requisição; a interface também limita os módulos disponíveis.

## Uso off-line

O cache do aplicativo é instalado no build de produção, servido em HTTPS ou localhost. O servidor de desenvolvimento (`npm run dev`) não instala esse cache.

Antes de usar sem internet, abra a versão publicada ou o preview, faça login e carregue as telas e os dados que pretende consultar. Cada conjunto de dados precisa ter sido carregado previamente nesse navegador. Mantenha a sessão aberta para reabrir o aplicativo sem conexão.

- Ocorrências, alunos, turmas e tipos de ocorrência podem ser consultados e alterados off-line, dentro das operações e permissões disponíveis no app. Professores ficam disponíveis para consulta. Relatórios usam os dados locais disponíveis.
- Alterações ficam no dispositivo, separadas por usuário e escola. A barra superior informa a conexão, as operações pendentes e possíveis erros de envio.
- Com o aplicativo aberto, a reconexão dispara o envio na ordem da fila e a busca de dados novos. A verificação também ocorre a cada 30 segundos e ao voltar à aba do aplicativo. O perfil é validado no servidor antes do envio; sessões expiradas exigem novo login para sincronizar.
- Identificadores UUID são criados antes do envio para permitir novas tentativas sem duplicar o mesmo cadastro. Não há resolução interativa de conflitos: atualizações concorrentes nos mesmos campos seguem a ordem em que são aplicadas no servidor.
- Falhas de validação ou permissão mantêm alterações pendentes e mostram o erro. Não limpe os dados do navegador enquanto houver pendências. Sair preserva a fila para o próximo login da mesma conta, mas impede continuar usando essa sessão off-line.
- Criação de contas, senhas, gestão de escolas e edição de perfis exigem internet. Ditado por voz depende do suporte off-line do navegador.
- Novas versões são baixadas em segundo plano. O aviso “Nova versão disponível” permite aplicar a atualização depois de salvar os formulários e sincronizar a fila.

### Verificar o modo off-line

```bash
npm run build
npm run preview
```

No endereço do preview:

1. Entre com internet e aguarde o carregamento dos dados necessários.
2. Desligue a conexão, reabra o aplicativo, crie uma ocorrência e altere um cadastro permitido.
3. Reabra novamente e confira a persistência local.
4. Reconecte, aguarde a fila chegar a zero e confira os registros no servidor.
5. Repita com outra conta para verificar o isolamento dos dados.

Validação automatizada da camada off-line:

```bash
npm run test:offline
```

## Comandos e publicação

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento. |
| `npm run build` | Gera a versão de produção em `dist/`, incluindo o service worker. |
| `npm run preview` | Serve o build localmente para conferência. |
| `npm run lint` | Executa o ESLint. |
| `npm run test:offline` | Executa os testes automatizados da camada off-line. |

Publique o conteúdo de `dist/` em uma hospedagem estática com HTTPS e configure as variáveis do Supabase antes de gerar o build. Configure também as URLs de redirecionamento no Supabase Auth para os fluxos de recuperação de senha.

O [`vite.config.js`](vite.config.js) usa `/` no desenvolvimento e nos builds da Vercel. Nos demais builds de produção, usa `/Ocorrencia-Escolar/`, previsto para GitHub Pages. Ajuste `base` se publicar em outro caminho. O roteamento usa `HashRouter`.

## Estrutura do projeto

```text
src/
  components/   Componentes de interface e formulários
  context/      Autenticação e estado das ocorrências
  hooks/        Hooks de dados e mensagens
  pages/        Telas do aplicativo
  services/     Integração com Supabase e armazenamento off-line
  utils/        Permissões, turnos e geração de relatórios
public/         Arquivos estáticos e service worker
scripts/        Testes e plugin de build off-line
supabase/       Schema, policies, scripts SQL e Edge Functions
documentos/     Manuais e materiais de apresentação
```

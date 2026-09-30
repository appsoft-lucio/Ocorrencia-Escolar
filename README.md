# React + Vite

## Uso off-line do EduRegistro

Após publicar esta versão, abra o aplicativo com internet, faça login e aguarde o
carregamento dos dados. Mantenha a sessão aberta para reabrir o app sem conexão.
O cache do aplicativo é instalado no build de produção (`npm run build` e
`npm run preview`), em HTTPS ou localhost; não é instalado pelo servidor de desenvolvimento.

- Ocorrências, alunos, turmas e tipos de ocorrência podem ser consultados e alterados
  off-line. Professores ficam disponíveis para consulta. Relatórios usam os dados locais.
- Alterações ficam no dispositivo, separadas por usuário e escola. A barra superior
  informa a conexão, o número de operações pendentes e possíveis erros de envio.
- Com o aplicativo aberto, a reconexão dispara o envio na ordem de criação e a busca
  de dados novos. A verificação também ocorre a cada 30 segundos e ao retornar à janela.
  O perfil é validado no servidor antes do envio. Sessões expiradas exigem novo login.
- Identificadores UUID são criados antes do envio; uma resposta perdida pode ser
  reenviada sem cadastrar novamente o mesmo registro. Alterações no mesmo campo
  seguem a ordem em que chegam ao servidor (a última enviada prevalece).
- Falhas de validação ou permissão mantêm a fila pendente e mostram o erro. Não limpe
  os dados do navegador enquanto houver pendências. Sair preserva a fila para o
  próximo login da mesma conta, mas impede continuar usando essa sessão off-line.
- Criação de contas, senhas, gestão de escolas e edição de perfis continuam exigindo
  internet. Ditado por voz depende do suporte off-line do navegador.
- Novas versões são baixadas em segundo plano. O aviso “Nova versão disponível”
  permite aplicar a atualização depois de salvar os formulários e sincronizar a fila.
  Esse ciclo segue o [ciclo de atualização de service workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers).

Validação automatizada: `npm run test:offline`.

Teste manual em produção/preview: entrar on-line, aguardar carregar, desligar a
conexão, reabrir o aplicativo, criar uma ocorrência e editar um cadastro. Reabrir
novamente para conferir a persistência; reconectar e conferir a redução da fila a
zero e os registros no servidor. Repetir com outra conta para verificar isolamento.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

// Importa a função defineConfig do Vite.
// Ela fornece autocomplete, validação e melhor organização da configuração.
import { defineConfig } from "vite";

// Importa o plugin oficial do React para o Vite.
// Este plugin permite que o Vite entenda arquivos JSX e utilize recursos do React.
import react from "@vitejs/plugin-react";

// Exporta a configuração do Vite.
// O defineConfig ajuda o editor a reconhecer corretamente as opções disponíveis.
export default defineConfig({
  // Lista de plugins utilizados pelo projeto.
  // Neste caso, apenas o plugin do React.
  plugins: [react()],

  // Define o caminho base da aplicação após o deploy.
  //
  // Quando o projeto é publicado no GitHub Pages, ele normalmente fica dentro
  // de uma subpasta com o nome do repositório.
  //
  // Exemplo:
  // https://appsoft-lucio.github.io/Ocorrencia-Escolar/
  //
  // Sem esta configuração, o Vite tentará carregar os arquivos JavaScript,
  // CSS e imagens da raiz do domínio:
  //
  // https://appsoft-lucio.github.io/assets/arquivo.js
  //
  // Mas os arquivos estarão em:
  //
  // https://appsoft-lucio.github.io/Ocorrencia-Escolar/assets/arquivo.js
  //
  // Isso faz a página aparecer em branco devido ao erro de carregamento.
  //
  // O valor deve ser exatamente o nome do repositório entre barras.
  base:
    process.env.VERCEL || process.env.NODE_ENV !== "production"
      ? "/"
      : "/Ocorrencia-Escolar/",
});

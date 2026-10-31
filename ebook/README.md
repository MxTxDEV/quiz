# E-book ROTA INVISÍVEL

Conteúdo do produto entregue ao comprador: guia completo (7 capítulos) e 4 bônus.

- Textos: `ebook/content/*.md` (Markdown com blocos `:::insight`, `:::dica`, `:::atencao`, `:::exercicio`,
  `:::exemplo`, `:::skill`, `:::script`, `:::destaque` e `:::cards`).
- Visual: `ebook/theme.css` (A4 para PDF + versão web responsiva).
- Gerar HTML + PDFs: `npm run ebook:build` (usa Playwright/Chromium).
- Saída: `public/acesso/rota-invisivel-k7q2m9xv4t/` — área do aluno (`index.html`), leitura online e PDFs.

O caminho da pasta é o "link secreto" entregue na área de membros do checkout. Para trocar o link
(ex.: se vazar), altere `ACCESS_DIR` em `build.mjs`, gere novamente e atualize o link na plataforma.

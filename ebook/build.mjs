// Gera o e-book ROTA INVISÍVEL e os bônus (HTML para leitura online + PDF) a partir dos arquivos .md.
// Uso: node ebook/build.mjs   (requer Playwright/Chromium para os PDFs)
//
// Convenções do Markdown:
//   # Título            → abertura de capítulo (página escura). Linha seguinte "> texto" vira o subtítulo.
//   ## / ###            → seções
//   :::tipo Título      → quadro (insight, dica, atencao, exercicio, exemplo, skill, script)  … :::
//   :::destaque         → frase de impacto … :::
//   :::cards            → grade de cartões; cada cartão começa com "### " … :::
//   - [ ] item          → checklist
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { marked } from "marked";

const root = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(import.meta.url);

/** Pasta pública com caminho não adivinhável (o link é entregue só a quem comprou). */
const ACCESS_DIR = "acesso/rota-invisivel-k7q2m9xv4t";

const BOOKS = [
  {
    file: "rota-invisivel.md",
    slug: "rota-invisivel",
    label: "Guia prático",
    title: "Rota Invisível",
    subtitle: "Encontre caminhos para ganhar dinheiro que você ainda não enxergou.",
    pdf: "Rota-Invisivel-Guia-Completo.pdf",
    toc: true,
  },
  { file: "bonus-30-ideias.md", slug: "bonus-30-ideias", label: "Bônus 01", title: "30 ideias de renda extra", subtitle: "Possibilidades para explorar — com investimento, tempo e primeiro passo de cada uma.", pdf: "Bonus-01-30-Ideias-de-Renda-Extra.pdf" },
  { file: "bonus-kit-ferramentas.md", slug: "bonus-kit-ferramentas", label: "Bônus 02", title: "Kit de ferramentas gratuitas", subtitle: "Recursos para criar, divulgar, vender e se organizar sem gastar.", pdf: "Bonus-02-Kit-de-Ferramentas-Gratuitas.pdf" },
  { file: "bonus-guia-clientes.md", slug: "bonus-guia-clientes", label: "Bônus 03", title: "Guia para conseguir clientes", subtitle: "Scripts, abordagens e rotinas para encontrar seus primeiros compradores.", pdf: "Bonus-03-Guia-para-Conseguir-Clientes.pdf" },
  { file: "bonus-plano-30-dias.md", slug: "bonus-plano-30-dias", label: "Bônus 04", title: "Plano de execução de 30 dias", subtitle: "Um roteiro diário para sair da ideia e colocar uma oportunidade em prática.", pdf: "Bonus-04-Plano-de-Execucao-30-Dias.pdf" },
];

/**
 * Produtos entregues, cada um com a sua pasta (link) própria.
 * Os order bumps são produtos separados na Kiwify: quem compra o bump recebe só o link dele.
 */
const PRODUCTS = [
  {
    accessDir: ACCESS_DIR,
    books: BOOKS,
    welcome: {
      title: "Bem-vindo à sua rota.",
      text: "Aqui está todo o material do Rota Invisível: o guia completo e os 4 bônus. Você pode ler online, no celular ou no computador, ou baixar os PDFs para ler quando quiser.",
      steps: [
        ["1 · Leia", "Comece pelo guia completo, na ordem dos capítulos."],
        ["2 · Escolha", "Use os bônus para escolher sua ideia e montar sua abordagem."],
        ["3 · Execute", "Siga o plano de 30 dias, um dia de cada vez."],
      ],
      sep: "Bônus",
    },
  },
  {
    accessDir: "acesso/calculadora-preco-cexjcg6epw",
    books: [
      {
        file: "bump-calculadora-preco.md",
        slug: "calculadora-preco-guia",
        label: "Guia rápido",
        title: "Calculadora de preço e lucro",
        subtitle: "A planilha que mostra o preço certo, o lucro de cada venda e quanto sobrou no mês.",
        pdf: "Calculadora-de-Preco-e-Lucro-Guia.pdf",
      },
    ],
    xlsx: { file: "Calculadora-de-Preco-e-Lucro.xlsx", title: "Planilha Calculadora de Preço e Lucro", subtitle: "Abre no Excel, no Google Planilhas e no celular. Preencha as células laranja-claro." },
    welcome: {
      title: "Sua calculadora chegou.",
      text: "Aqui estão a planilha Calculadora de Preço e Lucro e o guia rápido com três exemplos completos: produto, serviço e revenda.",
      steps: [
        ["1 · Baixe", "Baixe a planilha e salve uma cópia com o nome do seu negócio."],
        ["2 · Preencha", "Escolha a aba do seu caso e troque os exemplos pelos seus números."],
        ["3 · Compare", "Pesquise 5 ofertas parecidas e defina o seu preço de lançamento."],
      ],
    },
  },
  {
    accessDir: "acesso/kit-divulgacao-zyuukvr6xb",
    books: [
      {
        file: "bump-kit-divulgacao.md",
        slug: "kit-divulgacao",
        label: "Kit completo",
        title: "Kit de divulgação pronto",
        subtitle: "30 legendas, 20 status, bios, mensagens automáticas e roteiros de vídeo para adaptar e postar.",
        pdf: "Kit-de-Divulgacao-Pronto.pdf",
      },
    ],
    welcome: {
      title: "Seu kit de divulgação chegou.",
      text: "Textos prontos para o status, os stories, o feed e o WhatsApp Business. Troque os colchetes pelas suas informações e comece pela Semana 1.",
      steps: [
        ["1 · Perfil", "Escreva sua bio e configure as mensagens automáticas."],
        ["2 · Separe", "Junte 7 fotos ou vídeos do seu trabalho ou do processo."],
        ["3 · Poste", "Siga o calendário: uma legenda por dia, na ordem."],
      ],
    },
  },
];

const BOX = {
  insight: { icon: "◆", label: "Insight" },
  dica: { icon: "✓", label: "Dica prática" },
  atencao: { icon: "!", label: "Atenção" },
  exercicio: { icon: "✎", label: "Exercício" },
  exemplo: { icon: "▸", label: "Exemplo" },
  skill: { icon: "★", label: "Skill" },
  script: { icon: "✉", label: "Script pronto" },
};

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function routeSvg(seed = 0) {
  const paths = [
    "M-5 125 C 20 112, 22 84, 45 80 S 72 60, 70 40 S 88 16, 110 10",
    "M-5 95 C 18 100, 30 70, 50 72 S 78 90, 82 62 S 96 30, 110 26",
    "M-5 60 C 15 70, 32 50, 48 58 S 70 86, 86 70 S 98 40, 110 44",
  ];
  const d = paths[seed % paths.length];
  return `<svg class="route" viewBox="0 0 100 133" preserveAspectRatio="none" aria-hidden="true">
    <path d="${d}" fill="none" stroke="#ff6b00" stroke-width=".55" stroke-dasharray="1.6 1.6"/>
    <circle cx="70" cy="40" r="1.4" fill="#ff6b00"/><circle cx="70" cy="40" r="3.4" fill="none" stroke="#ff6b00" stroke-opacity=".35" stroke-width=".4"/>
  </svg>`;
}

/** Converte os blocos personalizados (:::) e renderiza o Markdown. */
function renderBody(md) {
  const out = [];
  const lines = md.split("\n");
  let i = 0;
  let buffer = [];
  const flush = () => {
    if (buffer.length) out.push(marked.parse(buffer.join("\n")));
    buffer = [];
  };
  while (i < lines.length) {
    const m = lines[i].match(/^:::(\w+)\s*(.*)$/);
    if (!m) {
      buffer.push(lines[i++]);
      continue;
    }
    flush();
    const [, type, title] = m;
    const inner = [];
    i++;
    while (i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i++]);
    i++;
    const body = inner.join("\n");
    if (type === "destaque") out.push(`<div class="destaque">${marked.parse(body)}</div>`);
    else if (type === "cards") {
      const cards = body.split(/^### /m).filter((c) => c.trim());
      out.push(
        `<div class="cards">${cards
          .map((c) => {
            const [head, ...rest] = c.split("\n");
            const [n, ...t] = head.split("|").map((x) => x.trim());
            const titleTxt = t.length ? t.join(" ") : n;
            return `<div class="card">${t.length ? `<div class="card-n">${esc(n)}</div>` : ""}<h3>${esc(titleTxt)}</h3>${marked.parse(rest.join("\n"), { breaks: true })}</div>`;
          })
          .join("")}</div>`,
      );
    } else {
      const meta = BOX[type] ?? { icon: "•", label: type };
      // scripts e exemplos preservam as quebras de linha (catálogos, roteiros com tempos)
      const opts = type === "script" || type === "exemplo" ? { breaks: true } : undefined;
      out.push(
        `<div class="box ${type}"><div class="box-title"><span class="ic">${meta.icon}</span>${esc(title || meta.label)}</div>${marked.parse(body, opts)}</div>`,
      );
    }
  }
  flush();
  return out
    .join("\n")
    .replace(/<li><input (checked="" )?disabled="" type="checkbox">/g, '<li class="task"><input disabled type="checkbox"><span>')
    .replace(/(<li class="task">[\s\S]*?)<\/li>/g, "$1</span></li>");
}

function buildBook(book, BASE) {
  const md = readFileSync(path.join(root, "content", book.file), "utf8");
  // divide em capítulos pelos títulos de nível 1
  const parts = md.split(/^# /m);
  const intro = parts.shift() ?? "";
  const chapters = parts.map((p, idx) => {
    const [titleLine, ...rest] = p.split("\n");
    let lead = "";
    while (rest.length && rest[0].trim() === "") rest.shift();
    if (rest[0]?.startsWith("> ")) lead = rest.shift().slice(2);
    const numbered = /^(Capítulo|Módulo)\s+(\d+)/i.exec(titleLine);
    return { idx, title: titleLine.replace(/^(Capítulo|Módulo)\s+\d+\s*[—:-]\s*/i, "").trim(), rawTitle: titleLine.trim(), kicker: numbered ? `${numbered[1]} ${numbered[2].padStart(2, "0")}` : "", num: numbered ? numbered[2].padStart(2, "0") : "", lead, body: rest.join("\n") };
  });

  const cover = `<section class="cover">${routeSvg(0)}
    <div class="brand">Rota <span>Invisível</span></div>
    <div class="bottom">
      <div class="bar"></div><br/>
      <div class="label">${esc(book.label)}</div>
      <h1>${esc(book.title)}</h1>
      <div class="subtitle">${esc(book.subtitle)}</div>
      <div class="foot">Produto educativo · Resultados financeiros não são garantidos</div>
    </div>
  </section>`;

  const toc = book.toc
    ? `<section class="toc content"><h2>Sumário</h2><ol>${chapters
        .map((c) => `<li><span class="n">${c.num || "•"}</span><span class="t">${esc(c.title)}${c.lead ? `<span class="d">${esc(c.lead)}</span>` : ""}</span></li>`)
        .join("")}</ol></section>`
    : "";

  const introHtml = intro.trim() ? `<section class="content">${renderBody(intro)}</section>` : "";
  const chaptersHtml = chapters
    .map(
      (c, k) => `<section class="opener">${routeSvg(k + 1)}${c.num ? `<div class="num">${c.num}</div>` : ""}
        ${c.kicker ? `<div class="kicker">${esc(c.kicker)}</div>` : ""}<h1>${esc(c.title)}</h1>${c.lead ? `<div class="lead">${esc(c.lead)}</div>` : ""}</section>
        <section class="content">${renderBody(c.body)}</section>`,
    )
    .join("\n");

  const css = readFileSync(path.join(root, "theme.css"), "utf8");
  const html = (web) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="robots" content="noindex,nofollow"/>
<title>${esc(book.title)} · Rota Invisível</title><style>${css}</style></head><body>
${web ? `<div class="topbar"><a class="brand" href="${BASE}">← Rota <span>Invisível</span></a><a class="btn" href="${BASE}${book.pdf}" download>Baixar PDF</a></div>` : ""}
<main class="doc">${cover}${toc}${introHtml}${chaptersHtml}</main></body></html>`;
  return { web: html(true), print: html(false) };
}

function indexPage(product) {
  const BASE = `/${product.accessDir}/`;
  const { welcome: w, xlsx } = product;
  const css = readFileSync(path.join(root, "theme.css"), "utf8");
  const [main, ...bonus] = product.books;
  const sheetCard = xlsx
    ? `
    <article class="item">
      <div class="mini sheet">${routeSvg(2)}<span class="mini-label">Planilha</span><span class="mini-title">.xlsx</span></div>
      <div class="info">
        <p class="lbl">Planilha</p><h2>${esc(xlsx.title)}</h2><p class="sub">${esc(xlsx.subtitle)}</p>
        <div class="actions"><a class="primary" href="${BASE}${xlsx.file}" download>Baixar planilha</a></div>
      </div>
    </article>`
    : "";
  const card = (b, big) => `
    <article class="item ${big ? "big" : ""}">
      <div class="mini">${routeSvg(1)}<span class="mini-label">${esc(b.label)}</span><span class="mini-title">${esc(b.title)}</span></div>
      <div class="info">
        <p class="lbl">${esc(b.label)}</p><h2>${esc(b.title)}</h2><p class="sub">${esc(b.subtitle)}</p>
        <div class="actions"><a class="primary" href="${BASE}${b.slug}.html">Ler online</a><a class="ghost" href="${BASE}${b.pdf}" download>Baixar PDF</a></div>
      </div>
    </article>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="noindex,nofollow"/><title>Seu acesso · Rota Invisível</title>
<style>${css}
@media screen { body { background: var(--ink); color: #fff; } }
.wrap { max-width: 980px; margin: 0 auto; padding: 40px 20px 60px; }
.head { display:flex; justify-content:space-between; align-items:center; margin-bottom: 44px; }
.logo { font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
.logo span { color: var(--orange); }
.welcome .k { color: var(--orange); font-weight: 800; letter-spacing: .2em; text-transform: uppercase; font-size: 12px; }
.welcome h1 { font-size: clamp(30px, 6vw, 48px); line-height: 1.05; margin: 10px 0 14px; font-weight: 900; letter-spacing: -.02em; }
.welcome p { color: #b9b9c0; max-width: 640px; line-height: 1.6; }
.steps { display:grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin: 30px 0 42px; }
.step { border:1px solid #26262a; border-radius: 12px; padding: 16px; background: var(--ink-2); font-size: 15px; color:#d4d4d8; }
.step b { display:block; color: var(--orange); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; margin-bottom: 6px; }
.list { display:grid; gap: 14px; }
.item { display:grid; grid-template-columns: 150px 1fr; gap: 22px; align-items:center; border:1px solid #26262a; background: var(--ink-2); border-radius: 16px; padding: 18px; }
.item.big { grid-template-columns: 200px 1fr; border-color: rgba(255,107,0,.5); box-shadow: 0 20px 60px -30px rgba(255,107,0,.6); }
.mini { position:relative; aspect-ratio: 3/4; background:#0b0b0c; border:1px solid #2b2b30; border-radius: 4px 8px 8px 4px; overflow:hidden; display:flex; flex-direction:column; justify-content:flex-end; padding: 12px; box-shadow: 10px 16px 30px -10px rgba(0,0,0,.8); transform: perspective(600px) rotateY(-10deg); }
.mini .route { position:absolute; inset:0; width:100%; height:100%; }
.mini-label { position:relative; color: var(--orange); font-size: 9px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.mini-title { position:relative; font-weight: 900; text-transform: uppercase; line-height: .95; font-size: 15px; margin-top: 4px; }
.big .mini-title { font-size: 22px; }
.info .lbl { color: var(--orange); font-weight: 800; letter-spacing: .16em; text-transform: uppercase; font-size: 11px; margin: 0; }
.info h2 { margin: 6px 0 6px; font-size: 22px; font-weight: 900; }
.big .info h2 { font-size: 30px; }
.info .sub { color: #a9a9b1; margin: 0 0 16px; font-size: 15px; line-height: 1.5; }
.actions { display:flex; gap: 10px; flex-wrap: wrap; }
.actions a { text-decoration:none; font-weight: 800; font-size: 14px; padding: 11px 16px; border-radius: 10px; }
.primary { background: var(--orange); color: var(--ink); }
.ghost { border:1px solid #3a3a40; color:#fff; }
.sep { margin: 34px 0 14px; color:#8a8a93; font-size: 12px; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; }
.legal { margin-top: 48px; color:#77777f; font-size: 13px; line-height: 1.6; border-top:1px solid #222226; padding-top: 18px; }
@media (max-width: 680px) {
  .steps { grid-template-columns: 1fr; }
  .item, .item.big { grid-template-columns: 96px 1fr; gap: 14px; padding: 14px; }
  .mini-title, .big .mini-title { font-size: 11px; }
  .info h2, .big .info h2 { font-size: 18px; }
  .info .sub { display:none; }
}
</style></head><body><div class="wrap">
<div class="head"><div class="logo">Rota <span>Invisível</span></div></div>
<section class="welcome"><div class="k">Área do aluno</div><h1>${esc(w.title)}</h1>
<p>${esc(w.text)}</p></section>
<div class="steps">${w.steps.map(([t, d]) => `<div class="step"><b>${esc(t)}</b>${esc(d)}</div>`).join("")}</div>
<div class="list">${sheetCard}${card(main, !xlsx)}</div>
${bonus.length ? `<div class="sep">${esc(w.sep ?? "Extras")}</div>
<div class="list">${bonus.map((b) => card(b, false)).join("")}</div>` : ""}
<p class="legal">Material educativo. Resultados financeiros não são garantidos e dependem de fatores individuais, como dedicação, contexto e aplicação. Este link é pessoal: não compartilhe.</p>
</div></body></html>`;
}

// ---------------------------------------------------------------- execução
const printDir = path.join(root, ".print");
mkdirSync(printDir, { recursive: true });
const only = process.argv[2];
const jobs = [];

for (const product of PRODUCTS) {
  const outDir = path.join(root, "..", "public", product.accessDir);
  const BASE = `/${product.accessDir}/`; // links absolutos: funcionam com ou sem barra final
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });
  for (const b of product.books) {
    const { web, print } = buildBook(b, BASE);
    writeFileSync(path.join(outDir, `${b.slug}.html`), web);
    writeFileSync(path.join(printDir, `${b.slug}.html`), print);
    jobs.push({ b, outDir });
  }
  writeFileSync(path.join(outDir, "index.html"), indexPage(product));
  if (product.xlsx) execFileSync("python3", [path.join(root, "planilha.py"), path.join(outDir, product.xlsx.file)], { stdio: "inherit" });
  console.log(`Saída: public/${product.accessDir}/`);
}

if (only !== "--no-pdf") {
  const { chromium } = require("playwright");
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const { b, outDir } of jobs) {
    await page.goto(`file://${path.join(printDir, `${b.slug}.html`)}`, { waitUntil: "load" });
    await page.pdf({
      path: path.join(outDir, b.pdf),
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: `<div style="width:100%;font-family:Inter,Arial;font-size:7.5pt;color:#8a8a93;padding:0 18mm;display:flex;justify-content:space-between"><span>ROTA INVISÍVEL · ${esc(b.label)}</span><span class="pageNumber"></span></div>`,
    });
    console.log(`PDF: ${b.pdf}`);
  }
  await browser.close();
}
rmSync(printDir, { recursive: true });

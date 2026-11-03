// Gera as prévias públicas do produto a partir do material REAL (HTML do e-book em public/acesso/...).
// Cada prévia é um recorte de uma página de verdade — nada é reescrito. Uso: node ebook/previa.mjs
import { createRequire } from "node:module";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const SRC = path.resolve("public/acesso/rota-invisivel-k7q2m9xv4t");
const OUT = path.resolve("public/produto/previa");
const ALVOS = [
  // id, arquivo, texto do título inicial, como terminar o recorte
  { id: "capitulo-1", file: "rota-invisivel.html", start: "O que é, de fato, uma renda extra", maxH: 1100 },
  { id: "ideias", file: "bonus-30-ideias.html", start: "Grupo 1 — Serviços pela internet", until: { sel: ".card", n: 4 }, maxH: 1200 },
  { id: "clientes", file: "bonus-guia-clientes.html", start: "Scripts de abordagem", until: { sel: ".box.script", n: 2 }, maxH: 1100 },
  { id: "plano-30-dias", file: "bonus-plano-30-dias.html", start: "Semana 1 — Escolher e preparar", maxH: 1000 },
  { id: "ferramentas", file: "bonus-kit-ferramentas.html", start: "1. Atendimento e vendas", maxH: 1100 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 430, height: 1200 }, deviceScaleFactor: 2.5 });
for (const a of ALVOS) {
  await page.goto("file://" + path.join(SRC, a.file));
  await page.evaluate(() => document.fonts.ready);
  const clip = await page.evaluate(({ start, until, maxH }) => {
    const h = [...document.querySelectorAll("h1,h2,h3")].find((e) => e.textContent.trim().startsWith(start));
    if (!h) return null;
    const top = h.getBoundingClientRect().top + scrollY - 28;
    const box = (h.closest("section") || h.parentElement).getBoundingClientRect();
    let bottom = top + maxH;
    if (until) {
      const els = [...document.querySelectorAll(until.sel)].filter((e) => e.getBoundingClientRect().top + scrollY > top);
      const last = els[until.n - 1];
      if (last) bottom = Math.min(bottom, last.getBoundingClientRect().bottom + scrollY + 24);
    }
    return { x: Math.max(0, box.left - 24), y: top, width: Math.min(document.documentElement.clientWidth, box.width + 48), height: bottom - top };
  }, a);
  if (!clip) throw new Error(`Trecho não encontrado: ${a.start} (${a.file})`);
  await page.screenshot({ path: path.join(OUT, `${a.id}.jpg`), type: "jpeg", quality: 78, clip, fullPage: true });
  console.log("ok", a.id, Math.round(clip.width), "x", Math.round(clip.height));
}
await browser.close();

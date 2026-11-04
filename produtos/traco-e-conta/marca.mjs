// Marca Traço & Conta: logo, ícone, capas dos produtos e prévias reais das folhas para a página de vendas.
// Uso: node produtos/traco-e-conta/marca.mjs
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, copyFileSync, readFileSync } from "node:fs";
import path from "node:path";
import * as L from "./modulos-letras.mjs";
import * as M from "./modulos-mat.mjs";
import * as B from "./bonus.mjs";
import { doc, CSS } from "./lib.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const site = path.join(here, "..", "..", "public", "traco-e-conta");
const img = path.join(site, "img");
const marca = path.join(here, "marca");
for (const d of [site, img, marca, path.join(site, "fonts")]) mkdirSync(d, { recursive: true });
for (const f of ["fredoka-latin-500-normal.woff2", "fredoka-latin-600-normal.woff2", "fredoka-latin-700-normal.woff2", "nunito-latin-400-normal.woff2", "nunito-latin-700-normal.woff2", "nunito-latin-800-normal.woff2", "nunito-latin-900-normal.woff2"]) copyFileSync(path.join(here, "fontes", f), path.join(site, "fonts", f));
const contagem = JSON.parse(readFileSync(path.join(here, "contagem.json"), "utf8"));

// ---------------------------------------------------------------- logo (SVG com o lápis desenhando o traço)
export const ICONE = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="112" height="112" rx="30" fill="#2563eb"/>
  <path d="M22 84 C 34 60, 46 98, 58 74 S 80 54, 86 40" fill="none" stroke="#fde047" stroke-width="6" stroke-linecap="round" stroke-dasharray="1 11"/>
  <g transform="translate(86 40) rotate(40)">
    <rect x="-9" y="-46" width="18" height="40" rx="3" fill="#f97316"/>
    <rect x="-9" y="-50" width="18" height="8" rx="3" fill="#fda4af"/>
    <rect x="-9" y="-44" width="18" height="4" fill="#e2e8f0"/>
    <path d="M-9 -6 L9 -6 L0 12 Z" fill="#fde68a"/><path d="M-3 6 L3 6 L0 12 Z" fill="#1e293b"/>
  </g>
  <circle cx="30" cy="30" r="6" fill="#4ade80"/><path d="M27 30 h6 M30 27 v6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
</svg>`;
const fontes = `@font-face{font-family:Fredoka;font-weight:600;src:url(data:font/woff2;base64,${readFileSync(path.join(here, "fontes/fredoka-latin-600-normal.woff2")).toString("base64")})}@font-face{font-family:Fredoka;font-weight:700;src:url(data:font/woff2;base64,${readFileSync(path.join(here, "fontes/fredoka-latin-700-normal.woff2")).toString("base64")})}@font-face{font-family:Nunito;font-weight:800;src:url(data:font/woff2;base64,${readFileSync(path.join(here, "fontes/nunito-latin-800-normal.woff2")).toString("base64")})}`;
const wordmark = (size = 64, tag = true) => `<div style="display:flex;align-items:center;gap:${size * 0.28}px">
  <div style="width:${size * 1.25}px;height:${size * 1.25}px">${ICONE}</div>
  <div><div style="font-family:Fredoka;font-weight:700;font-size:${size}px;line-height:1;letter-spacing:-.01em"><span style="color:#2563eb">Traço</span> <span style="color:#f97316">&amp;</span> <span style="color:#16a34a">Conta</span></div>
  ${tag ? `<div style="font-family:Nunito;font-weight:800;font-size:${size * 0.27}px;color:#64748b;letter-spacing:.08em;text-transform:uppercase;margin-top:${size * 0.12}px">atividades para aprender brincando</div>` : ""}</div></div>`;
writeFileSync(path.join(img, "icone.svg"), ICONE);
writeFileSync(path.join(marca, "icone.svg"), ICONE);

const browser = await chromium.launch();
const shot = async (html, file, w, h, { transparent = false, type = "png" } = {}) => {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontes}*{margin:0;box-sizing:border-box}body{width:${w}px;height:${h}px;overflow:hidden;${transparent ? "background:transparent" : ""}}</style></head><body>${html}</body></html>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: file, omitBackground: transparent, type, ...(type === "jpeg" ? { quality: 84 } : {}) });
  await p.close();
};

await shot(`<div style="padding:30px 40px">${wordmark(72)}</div>`, path.join(marca, "logo-horizontal.png"), 980, 190, { transparent: true });
await shot(`<div style="width:1080px;height:1080px;background:#fffbeb;display:grid;place-items:center"><div style="display:flex;flex-direction:column;align-items:center;gap:40px"><div style="width:420px;height:420px">${ICONE}</div><div style="font-family:Fredoka;font-weight:700;font-size:96px"><span style="color:#2563eb">Traço</span> <span style="color:#f97316">&amp;</span> <span style="color:#16a34a">Conta</span></div></div></div>`, path.join(marca, "perfil-1080.png"), 1080, 1080);
await shot(`<div style="width:512px;height:512px">${ICONE}</div>`, path.join(marca, "icone-512.png"), 512, 512, { transparent: true });
await shot(`<div style="width:180px;height:180px">${ICONE}</div>`, path.join(site, "apple-touch-icon.png"), 180, 180, { transparent: true });

// ---------------------------------------------------------------- prévias reais das folhas
const PREV = [
  ["alfabeto", L.alfabeto, 0], ["silabas", L.silabas, 1], ["ortografia", L.ortografia, 0], ["leitura", L.leitura, 0], ["motora", L.motora, 2], ["numeros", M.numeros, 7],
  ["contas", M.contas, 0], ["labirinto", M.labirintos, 6], ["caca", M.caca, 0], ["sequencia", M.logica, 0], ["separar", L.separar, 0], ["desenho", M.desenho, 0],
  ["complexas", L.complexas, 6], ["escrita", L.escrita, 2], ["formas", M.formas, 5], ["quantidades", M.quantidades, 0],
  ["b-ingles", B.ingles, 2], ["b-dinheiro", B.dinheirinho, 5], ["b-horas", B.horas, 1], ["b-sondagem", B.sondagem, 0], ["b-parede", B.parede, 0],
];
const pv = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 1 });
for (const [nome, fn, i] of PREV) {
  await pv.setContent(doc([fn().pages[i]], nome)); await pv.evaluate(() => document.fonts.ready); await pv.waitForTimeout(80);
  await pv.locator(".page").first().screenshot({ path: path.join(img, `folha-${nome}.jpg`), type: "jpeg", quality: 80 });
}

// ---------------------------------------------------------------- capas dos produtos (1080×1080), com folhas reais
const toB64 = (f) => `data:image/jpeg;base64,${readFileSync(path.join(img, f)).toString("base64")}`;
const folha = (f, x, y, w, rot, z = 1) => `<img src="${toB64(f)}" style="position:absolute;left:${x}px;top:${y}px;width:${w}px;transform:rotate(${rot}deg);border-radius:10px;box-shadow:0 24px 50px -16px rgba(30,41,59,.55);z-index:${z};border:1px solid #e2e8f0">`;
const capa = ({ titulo, sub, selo, folhas, cor }) => `<div style="position:relative;width:1080px;height:1080px;overflow:hidden;background:radial-gradient(circle at 80% 15%, #fef3c7, #fffbeb 55%);font-family:Nunito">
  <div style="position:absolute;inset:26px;border:8px dashed ${cor}33;border-radius:48px"></div>
  <div style="position:absolute;left:70px;top:70px">${wordmark(46, false)}</div>
  <div style="position:absolute;right:70px;top:66px;background:${cor};color:#fff;font-family:Fredoka;font-weight:700;font-size:30px;padding:14px 28px;border-radius:99px">${selo}</div>
  <div style="position:absolute;left:70px;top:190px;width:940px"><div style="font-family:Fredoka;font-weight:700;font-size:92px;line-height:.98;color:#1e293b">${titulo}</div><div style="font-family:Nunito;font-weight:800;font-size:34px;color:#475569;margin-top:18px">${sub}</div></div>
  ${folhas}
</div>`;
const fb = folha("folha-alfabeto.jpg", 70, 520, 330, -8, 2) + folha("folha-contas.jpg", 380, 480, 330, 2, 3) + folha("folha-labirinto.jpg", 690, 530, 330, 9, 2);
await shot(capa({ titulo: `${contagem.atividades} atividades<br>para imprimir`, sub: "Alfabetização e matemática · 4 a 8 anos", selo: "KIT BÁSICO", folhas: fb, cor: "#2563eb" }), path.join(marca, "capa-kit-basico.png"), 1080, 1080);
const fc = folha("folha-silabas.jpg", 40, 540, 300, -10, 2) + folha("folha-b-ingles.jpg", 280, 500, 300, -3, 3) + folha("folha-numeros.jpg", 520, 520, 300, 4, 4) + folha("folha-b-horas.jpg", 760, 560, 300, 11, 3);
await shot(capa({ titulo: `${contagem.atividades} atividades<br>+ 5 apostilas bônus`, sub: `Kit Básico e mais ${contagem.bonusPaginas} páginas de bônus`, selo: "KIT COMPLETO", folhas: fc, cor: "#16a34a" }), path.join(marca, "capa-kit-completo.png"), 1080, 1080);
const fbo = folha("folha-b-ingles.jpg", 60, 520, 310, -8, 2) + folha("folha-b-dinheiro.jpg", 385, 490, 310, 1, 3) + folha("folha-b-parede.jpg", 700, 530, 310, 8, 2);
await shot(capa({ titulo: `5 apostilas<br>bônus`, sub: "Inglês · dinheirinho · horas · sondagem · parede", selo: "BÔNUS", folhas: fbo, cor: "#f59e0b" }), path.join(marca, "capa-bonus.png"), 1080, 1080);
for (const f of ["capa-kit-basico.png", "capa-kit-completo.png", "capa-bonus.png"]) copyFileSync(path.join(marca, f), path.join(img, f));
await browser.close();
console.log("ok: marca, capas e prévias");

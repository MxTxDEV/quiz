// Imagem do order bump (produto "5 apostilas bônus"), legível em miniatura. 1080×1080.
// Uso: node produtos/traco-e-conta/bump.mjs
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const img = path.join(here, "..", "..", "public", "traco-e-conta", "img");
const out = path.join(here, "marca", "checkout");
mkdirSync(out, { recursive: true });
const b64 = (f) => `data:image/jpeg;base64,${readFileSync(path.join(img, `folha-${f}.jpg`)).toString("base64")}`;
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(here, "fontes", f)).toString("base64")}`;
const css = `@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{width:1080px;height:1080px;overflow:hidden;position:relative;font-family:Nunito;background:radial-gradient(circle at 50% 35%,#fde68a,#f59e0b 75%)}
.sheet{position:absolute;border-radius:14px;border:3px solid #fff;box-shadow:0 30px 50px -18px rgba(120,53,15,.6);background:#fff}`;
const sheet = (f, w, x, y, r, z) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg);z-index:${z}">`;
const html = `${sheet("b-ingles", 330, 90, 120, -14, 2)}${sheet("b-dinheiro", 330, 375, 70, -2, 3)}${sheet("b-horas", 330, 650, 120, 13, 2)}
<div style="position:absolute;left:0;right:0;bottom:70px;text-align:center;z-index:5">
  <div style="display:inline-block;background:#fff;border-radius:40px;padding:26px 56px 30px;box-shadow:0 26px 50px -20px rgba(120,53,15,.7)">
    <div style="font-family:Fredoka;font-weight:700;font-size:150px;line-height:.95;color:#ea580c">+5 BÔNUS</div>
    <div style="font-weight:900;font-size:46px;color:#1e293b;margin-top:10px">apostilas para imprimir</div>
  </div></div>`;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
await p.screenshot({ path: path.join(out, "order-bump-5-bonus-1080.png") });
await p.setViewportSize({ width: 1080, height: 1080 });
await b.close(); console.log("ok");

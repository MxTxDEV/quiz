// Imagens para o checkout da Kiwify (Traço & Conta): banner de topo (desktop e celular) e banner lateral.
// Uso: node produtos/traco-e-conta/checkout.mjs   (rode antes marca.mjs, que gera as prévias das folhas)
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
const ICONE = readFileSync(path.join(img, "icone.svg"), "utf8");

const css = `@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}@font-face{font-family:Nunito;font-weight:800;src:url(${font("nunito-latin-800-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{overflow:hidden;font-family:Nunito,"Noto Color Emoji";color:#1e293b;background:#fffbeb;background-image:radial-gradient(#f2e3b6 1.6px,transparent 1.6px);background-size:26px 26px;position:relative}
.logo{display:flex;align-items:center;gap:10px;font-family:Fredoka;font-weight:700}.logo .ic svg{width:100%;height:100%;display:block}.a{color:#2563eb}.b{color:#f97316}.c{color:#16a34a}
h1{font-family:Fredoka;font-weight:700;line-height:1.02;letter-spacing:-.01em}
.sheet{position:absolute;border-radius:10px;border:2px solid #e2e8f0;box-shadow:0 22px 40px -16px rgba(30,41,59,.5);background:#fff}
.chips{display:flex;flex-wrap:wrap;gap:8px}.chips span{background:#fff;border:2px solid #fde68a;border-radius:999px;padding:7px 14px;font-weight:900;white-space:nowrap}
.tag{display:inline-block;color:#fff;font-family:Fredoka;font-weight:700;border-radius:999px;padding:6px 16px;letter-spacing:.04em}`;
const logo = (s) => `<div class="logo" style="font-size:${s}px"><span class="ic" style="width:${s * 1.35}px;height:${s * 1.35}px">${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>`;
const sheet = (f, w, x, y, r, z = 1) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg);z-index:${z}">`;

const P = {
  basico: { tag: "KIT BÁSICO", cor: "#2563eb", titulo: "280 atividades para imprimir", sub: "Alfabetização e matemática · 4 a 8 anos · com gabarito", folhas: ["alfabeto", "contas", "labirinto"],
    itens: ["280 atividades em 16 módulos", "Letras, sílabas e leitura", "Números e continhas", "Labirintos e caça-palavras", "Gabarito com as respostas"] },
  completo: { tag: "KIT COMPLETO", cor: "#16a34a", titulo: "280 atividades + 5 apostilas bônus", sub: "Kit Básico + inglês, dinheirinho, horas, sondagem e parede", folhas: ["silabas", "b-ingles", "b-horas"],
    itens: ["280 atividades + gabarito", "Inglês ilustrado", "Dinheirinho", "Horas e calendário", "Sondagem de escrita", "Parede e certificados"] },
};
const chips = (s) => `<div class="chips" style="font-size:${s}px"><span>📩 Acesso imediato por e-mail</span><span>🔒 Pagamento seguro</span><span>✅ 7 dias de garantia</span></div>`;

const topoDesktop = (p) => `<div style="width:1200px;height:400px;position:relative;padding:34px 44px">
  ${logo(30)}
  <div style="margin-top:22px;width:640px"><span class="tag" style="background:${p.cor};font-size:17px">${p.tag}</span>
  <h1 style="font-size:50px;margin-top:12px">${p.titulo}</h1><div style="font-weight:800;color:#475569;font-size:20px;margin-top:10px">${p.sub}</div></div>
  <div style="position:absolute;left:44px;bottom:30px">${chips(16)}</div>
  ${sheet(p.folhas[0], 200, 730, 70, -8, 2)}${sheet(p.folhas[1], 200, 880, 40, 1, 3)}${sheet(p.folhas[2], 200, 1020, 80, 8, 2)}</div>`;
const topoMobile = (p) => `<div style="width:800px;height:400px;position:relative;padding:28px 32px">
  ${logo(26)}
  <div style="margin-top:16px;width:470px"><span class="tag" style="background:${p.cor};font-size:15px">${p.tag}</span>
  <h1 style="font-size:40px;margin-top:10px">${p.titulo}</h1><div style="font-weight:800;color:#475569;font-size:17px;margin-top:8px">${p.sub}</div></div>
  <div style="position:absolute;left:32px;bottom:24px;width:480px">${chips(13)}</div>
  ${sheet(p.folhas[0], 170, 500, 60, -7, 2)}${sheet(p.folhas[2], 170, 610, 90, 7, 3)}</div>`;
const lateral = (p) => `<div style="width:600px;height:1200px;position:relative;padding:44px 40px">
  ${logo(34)}
  <div style="margin-top:26px"><span class="tag" style="background:${p.cor};font-size:20px">${p.tag}</span><h1 style="font-size:50px;margin-top:14px">${p.titulo}</h1></div>
  <div style="position:relative;height:400px;margin-top:20px">${sheet(p.folhas[0], 240, 10, 30, -8, 2)}${sheet(p.folhas[1], 240, 160, 0, 2, 3)}${sheet(p.folhas[2], 240, 300, 40, 9, 2)}</div>
  <div style="background:#fff;border-radius:22px;border:3px solid #fde68a;padding:22px 24px;margin-top:6px">
    <div style="font-family:Fredoka;font-weight:700;font-size:28px;margin-bottom:10px">O que você recebe</div>
    ${p.itens.map((t) => `<div style="display:flex;gap:12px;align-items:center;font-weight:900;font-size:22px;padding:6px 0"><span style="display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:17px;flex-shrink:0">✓</span>${t}</div>`).join("")}
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:22px;text-align:center;font-weight:900;font-size:18px">${[["📩", "Chega no<br>e-mail"], ["⬇️", "Baixe<br>os PDFs"], ["🖨️", "Imprima<br>e use"]].map(([e, t]) => `<div style="width:31%;background:#fff;border-radius:18px;padding:14px 6px;border:2px solid #f1e6c8"><div style="font-size:40px">${e}</div>${t}</div>`).join("")}</div>
</div>`;

const browser = await chromium.launch();
const shot = async (html, w, h, file) => {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="width:${w}px;height:${h}px">${html}</body></html>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(out, file) }); await p.close();
};
for (const [k, p] of Object.entries(P)) {
  await shot(topoDesktop(p), 1200, 400, `${k}-topo-desktop-1200x400.png`);
  await shot(topoMobile(p), 800, 400, `${k}-topo-celular-800x400.png`);
  await shot(lateral(p), 600, 1200, `${k}-lateral-600x1200.png`);
}
await browser.close();
console.log("ok:", out);

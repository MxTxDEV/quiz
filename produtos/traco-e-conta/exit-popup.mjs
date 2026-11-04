// Imagens do "Exit Popup" do checkout da Kiwify (1080×1080).
// Uso: node produtos/traco-e-conta/exit-popup.mjs
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
*{margin:0;box-sizing:border-box}body{width:1080px;height:1080px;overflow:hidden;font-family:Nunito,"Noto Color Emoji";color:#1e293b;background:#fffbeb;background-image:radial-gradient(#f2e3b6 2px,transparent 2px);background-size:32px 32px;position:relative}
.hd{background:#2563eb;color:#fff;text-align:center;padding:54px 60px 46px}.hd .pill{display:inline-block;background:#fde047;color:#1e293b;font-weight:900;font-size:26px;letter-spacing:.08em;border-radius:99px;padding:10px 26px}
h1{font-family:Fredoka;font-weight:700;line-height:1.04;font-size:76px;margin-top:22px}
.sheet{position:absolute;border-radius:12px;border:2px solid #e2e8f0;box-shadow:0 26px 48px -18px rgba(30,41,59,.5);background:#fff}
.li{display:flex;gap:16px;align-items:center;font-weight:900;font-size:34px;padding:8px 0}.li i{font-style:normal;display:grid;place-items:center;width:46px;height:46px;border-radius:50%;background:#dcfce7;color:#16a34a;font-size:26px;flex-shrink:0}
.logo{position:absolute;left:0;right:0;bottom:40px;display:flex;justify-content:center;align-items:center;gap:12px;font-family:Fredoka;font-weight:700;font-size:34px}.logo span svg{width:46px;height:46px;display:block}
.a{color:#2563eb}.b{color:#f97316}.c{color:#16a34a}`;
const logo = `<div class="logo"><span>${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>`;
const sheet = (f, w, x, y, r, z) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg);z-index:${z}">`;

const pages = {
  // checkout do Básico: oferece o Completo (ação ao clicar: abrir o link do checkout do Completo)
  "exit-basico-upgrade": `<div class="hd"><span class="pill">ANTES DE SAIR</span><h1>Por R$ 7,90 a mais,<br>leve as 5 apostilas bônus</h1></div>
    <div style="position:relative;height:350px;margin-top:26px">${sheet("b-ingles", 200, 190, 30, -9, 2)}${sheet("b-dinheiro", 200, 350, 6, -2, 3)}${sheet("b-horas", 200, 510, 18, 4, 4)}${sheet("b-parede", 200, 670, 44, 10, 3)}</div>
    <div style="text-align:center;margin-top:6px"><div style="font-weight:900;font-size:30px;color:#475569">Kit Completo: 280 atividades + 5 bônus</div><div style="font-family:Fredoka;font-weight:700;font-size:96px;color:#16a34a;line-height:1.05">R$ 17,90</div><div style="font-weight:900;font-size:26px;color:#64748b">pagamento único · acesso imediato</div></div>${logo}`,
  // reforço de confiança (serve para os dois checkouts; ação: apenas fechar)
  "exit-confianca": `<div class="hd"><span class="pill">FALTA POUCO</span><h1>Seu kit está a<br>um passo de chegar</h1></div>
    <div style="display:flex;gap:40px;padding:50px 70px 0;align-items:center">
      <div style="position:relative;width:360px;height:470px;flex-shrink:0">${sheet("alfabeto", 270, 0, 20, -7, 2)}${sheet("contas", 270, 90, 70, 5, 3)}</div>
      <div><div class="li"><i>✓</i>Acesso imediato por e-mail</div><div class="li"><i>✓</i>PDF para imprimir quantas vezes quiser</div><div class="li"><i>✓</i>Gabarito com as respostas</div><div class="li"><i>✓</i>Pagamento seguro</div><div class="li"><i>✓</i>7 dias de garantia</div></div>
    </div>${logo}`,
};
const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
for (const [nome, html] of Object.entries(pages)) {
  await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
  await p.screenshot({ path: path.join(out, `${nome}-1080.png`) });
}
await browser.close(); console.log("ok");

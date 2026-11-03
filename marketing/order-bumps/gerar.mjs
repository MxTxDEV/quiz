// Gera as imagens dos order bumps (para cadastrar na Kiwify) e capturas de conferência.
// Uso: node marketing/order-bumps/gerar.mjs
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
import path from "node:path";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";

const here = path.dirname(new URL(import.meta.url).pathname);
const pub = path.join(here, "..", "..", "public");
const out = path.join(here, "png");
mkdirSync(out, { recursive: true });

const BUMPS = [
  { id: "bump-1-calculadora", kicker: "Planilha + guia rápido", title: ["Calculadora", "de preço", "e lucro"], line: "Preço certo, lucro de cada venda e controle do mês", chips: ["Produto", "Serviço", "Revenda", "Controle do mês"], sheet: true },
  { id: "bump-2-kit-divulgacao", kicker: "Textos prontos para adaptar", title: ["Kit de", "divulgação", "pronto"], line: "30 legendas · 20 status · bios · WhatsApp Business · roteiros", chips: ["30 legendas", "20 status", "6 bios", "4 roteiros"], sheet: false },
];

const css = `
*{box-sizing:border-box;margin:0}
body{width:1080px;height:1080px;background:radial-gradient(120% 90% at 70% 20%,#2a1406 0%,#0b0b0c 55%);font-family:Inter,"Segoe UI",Roboto,Arial,sans-serif;color:#fff;overflow:hidden;position:relative}
.brand{position:absolute;top:64px;left:72px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;font-size:26px}.brand span{color:#ff6b00}
.tag{position:absolute;top:58px;right:72px;border:2px solid #ff6b00;color:#ff6b00;border-radius:999px;padding:10px 22px;font-weight:800;font-size:22px;letter-spacing:.08em;text-transform:uppercase}
.book{position:absolute;left:96px;top:200px;width:430px;height:580px;background:#0b0b0c;border:2px solid #2b2b30;border-radius:8px 18px 18px 8px;padding:40px;display:flex;flex-direction:column;justify-content:flex-end;transform:perspective(1400px) rotateY(-14deg);box-shadow:30px 40px 80px -20px rgba(0,0,0,.9),0 0 120px -10px rgba(255,107,0,.55)}
.book:before{content:"";position:absolute;left:0;top:0;bottom:0;width:18px;background:linear-gradient(90deg,#000,#1d1d20);border-radius:8px 0 0 8px}
.book .k{color:#ff6b00;font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:15px}
.book h1{font-weight:900;text-transform:uppercase;line-height:.95;font-size:50px;margin-top:12px;letter-spacing:-.01em}
.book .bar{width:70px;height:6px;background:#ff6b00;margin-bottom:22px}
.route{position:absolute;left:0;top:0;width:100%;height:55%;opacity:.8}
.grid{position:absolute;left:560px;top:300px;width:360px;height:420px;background:#fff;border-radius:16px;transform:rotate(5deg);box-shadow:0 30px 60px -20px rgba(0,0,0,.8);padding:18px;color:#1a1a1d;font-size:17px}
.grid .h{background:#0b0b0c;color:#ff6b00;font-weight:800;padding:10px 12px;border-radius:8px;font-size:15px;letter-spacing:.08em}
.grid .r{display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid #eee}
.grid .r b{background:#fff1e6;padding:2px 8px;border-radius:4px}
.grid .tot{margin-top:12px;background:#ff6b00;color:#fff;font-weight:900;font-size:24px;padding:14px;border-radius:10px;display:flex;justify-content:space-between}
.phone{position:absolute;left:600px;top:250px;width:300px;height:560px;background:#111;border:10px solid #222;border-radius:44px;transform:rotate(6deg);box-shadow:0 30px 60px -20px rgba(0,0,0,.8);padding:26px 16px;overflow:hidden}
.bub{background:#1f2c34;border-radius:14px;padding:12px 14px;font-size:16px;line-height:1.35;margin-bottom:12px;color:#e9edef}
.bub.me{background:#005c4b;margin-left:30px}
.bub small{color:#ff6b00;font-weight:800;display:block;margin-bottom:4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase}
.foot{position:absolute;left:72px;right:72px;bottom:64px}
.line{font-size:30px;font-weight:700;color:#e4e4e7;margin-bottom:22px}
.chips{display:flex;gap:12px;flex-wrap:wrap}.chips span{background:#1b1b1e;border:1px solid #333;border-radius:999px;padding:10px 20px;font-size:22px;font-weight:700}
`;
const route = `<svg class="route" viewBox="0 0 100 133" preserveAspectRatio="none"><path d="M-5 95 C 18 100, 30 70, 50 72 S 78 90, 82 62 S 96 30, 110 26" fill="none" stroke="#ff6b00" stroke-width=".7" stroke-dasharray="1.6 1.6"/><circle cx="82" cy="62" r="1.6" fill="#ff6b00"/></svg>`;
const sheet = `<div class="grid"><div class="h">PREÇO DE PRODUTO</div>
<div class="r">Custo por unidade<b>R$ 4,90</b></div><div class="r">Seu tempo<b>R$ 3,00</b></div><div class="r">Margem<b>25%</b></div><div class="r">Taxa de pagamento<b>0%</b></div><div class="r">Lucro da leva<b>R$ 42,00</b></div>
<div class="tot"><span>Preço</span><span>R$ 10,00</span></div></div>`;
const phone = `<div class="phone"><div class="bub"><small>Status · Dia 1</small>Prazer, eu sou [nome] 👋 Faço [produto] aqui em [bairro]…</div>
<div class="bub"><small>Bio</small>🍰 [Produto] caseiro por encomenda · 📍 [bairro] · 📲 Pedidos 👇</div>
<div class="bub me"><small>Saudação automática</small>Oi! Que bom ter você por aqui 😊 Me conta o que você procura…</div>
<div class="bub"><small>Como pedir</small>1. Me chama · 2. Escolhe · 3. Confirma no Pix ✅</div></div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1080 } });
for (const b of BUMPS) {
  await page.setContent(`<html><head><style>${css}</style></head><body>
<div class="brand">Rota <span>Invisível</span></div><div class="tag">Complemento</div>
<div class="book">${route}<div style="position:relative"><div class="bar"></div><div class="k">${b.kicker}</div><h1>${b.title.join("<br>")}</h1></div></div>
${b.sheet ? sheet : phone}
<div class="foot"><div class="line">${b.line}</div><div class="chips">${b.chips.map((c) => `<span>${c}</span>`).join("")}</div></div>
</body></html>`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, `${b.id}.png`) });
}
// conferência: áreas de acesso dos bumps no celular
const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
for (const dir of ["calculadora-preco-cexjcg6epw", "kit-divulgacao-zyuukvr6xb"]) {
  await m.goto(`file://${pub}/acesso/${dir}/index.html`);
  await m.screenshot({ path: path.join(tmpdir(), `check-${dir}.png`), fullPage: true });
}
await browser.close();
console.log("ok");

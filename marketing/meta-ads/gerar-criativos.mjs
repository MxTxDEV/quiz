// Gera os criativos dos anúncios (PNG) na identidade ROTA INVISÍVEL.
// Uso: node marketing/meta-ads/gerar-criativos.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const out = path.join(path.dirname(new URL(import.meta.url).pathname), "criativos");
mkdirSync(out, { recursive: true });

const route = `<svg class="route" viewBox="0 0 100 133" preserveAspectRatio="none"><path d="M-5 120 C 20 110, 25 80, 45 78 S 70 60, 72 40 S 90 18, 110 12" fill="none" stroke="#ff6b00" stroke-width=".9" stroke-dasharray="2.4 2.4"/><circle cx="72" cy="40" r="2" fill="#ff6b00"/><circle cx="72" cy="40" r="4.6" fill="none" stroke="#ff6b00" stroke-opacity=".35" stroke-width=".6"/></svg>`;
const book = (title, label = "Guia prático", w = 300) => `
  <div class="book" style="width:${w}px">
    <div class="pages"></div>
    <div class="cover">${route}<div class="bar"></div><div class="bt"><div class="bl">${label}</div><div class="bn">${title}</div></div></div>
  </div>`;

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: var(--w); height: var(--h); background: #0a0a0b; color: #fff; font-family: Inter, "Helvetica Neue", Arial, sans-serif; overflow: hidden; position: relative; }
.glow { position: absolute; width: 900px; height: 900px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,0,.28), transparent 62%); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 60px 60px; }
.wrap { position: absolute; inset: 0; padding: 80px 76px; display: flex; flex-direction: column; }
.brand { font-weight: 900; letter-spacing: .16em; font-size: 26px; text-transform: uppercase; }
.brand span { color: #ff6b00; }
.eyebrow { color: #ff6b00; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; font-size: 26px; }
h1 { font-weight: 900; letter-spacing: -.035em; line-height: 1.02; }
.sub { color: #b4b4bc; line-height: 1.38; }
.cta { display: inline-flex; align-items: center; gap: 14px; background: #ff6b00; color: #0a0a0b; font-weight: 900; text-transform: uppercase; letter-spacing: .02em; border-radius: 18px; box-shadow: 0 20px 50px -18px rgba(255,107,0,.8); }
.chip { display: inline-flex; align-items: center; gap: 10px; border: 2px solid rgba(255,107,0,.5); color: #ff6b00; border-radius: 999px; font-weight: 800; text-transform: uppercase; letter-spacing: .12em; }
.book { position: relative; aspect-ratio: 3/4; transform: perspective(1400px) rotateY(-22deg) rotateX(4deg); transform-style: preserve-3d; }
.book .pages { position: absolute; top: 2%; bottom: 2%; right: -4%; width: 7%; background: repeating-linear-gradient(90deg,#e8e8e8 0 2px,#cfcfcf 2px 3px); transform: rotateY(60deg); transform-origin: left; }
.book .cover { position: absolute; inset: 0; background: #0d0d0f; border: 1px solid rgba(255,255,255,.1); border-radius: 4px 10px 10px 4px; overflow: hidden; box-shadow: inset 8px 0 14px -8px rgba(255,255,255,.35), 30px 44px 80px -20px rgba(0,0,0,.9); display: flex; flex-direction: column; justify-content: space-between; padding: 9%; }
.book .route { position: absolute; inset: 0; width: 100%; height: 100%; }
.book .bar { position: relative; width: 30%; height: 4px; background: #ff6b00; }
.book .bt { position: relative; }
.book .bl { color: #ff6b00; font-size: .08em; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 6%; font-size: calc(var(--bw) * .05); }
.book .bn { font-weight: 900; text-transform: uppercase; line-height: .95; letter-spacing: -.01em; font-size: calc(var(--bw) * .14); }
.opt { display: flex; align-items: center; justify-content: space-between; border-radius: 20px; background: #161618; border: 2px solid transparent; font-weight: 700; }
.opt.on { border-color: #ff6b00; background: #2a1708; }
.dot { width: 34px; height: 34px; border-radius: 50%; background: #ff6b00; color: #0a0a0b; display: grid; place-items: center; font-weight: 900; font-size: 22px; }
.check { display: flex; align-items: center; gap: 22px; font-weight: 800; }
.check i { width: 1.6em; height: 1.6em; font-size: .62em; border-radius: 50%; background: rgba(255,107,0,.22); border: 2px solid rgba(255,107,0,.6); display: grid; place-items: center; color: #ff6b00; font-style: normal; font-weight: 900; flex-shrink: 0; }
.legal { color: #6f6f78; font-size: 18px; letter-spacing: .04em; }
`;

const ads = {
  // A — gancho direto
  A: (f) => `
    <div class="glow" style="right:-300px;top:${f ? 520 : 760}px"></div><div class="grid"></div>
    <div class="wrap">
      <div class="brand">Rota <span>Invisível</span></div>
      <div style="margin-top:${f ? 70 : 60}px">
        <h1 style="font-size:${f ? 92 : 104}px">Você não precisa de mais dinheiro para começar.</h1>
        <p class="sub" style="font-size:${f ? 40 : 46}px;margin-top:34px;max-width:${f ? 640 : 900}px">Precisa descobrir os caminhos que ainda não enxergou.</p>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:${f ? "flex-end" : "center"};--bw:${f ? 330 : 430}px">${book("Rota Invisível", "Guia prático", f ? 330 : 430)}</div>
      <div><span class="cta" style="font-size:${f ? 34 : 40}px;padding:${f ? "28px 40px" : "34px 48px"}">Faça o quiz gratuito →</span></div>
    </div>`,
  // B — quiz
  B: (f) => `
    <div class="glow" style="left:-380px;top:${f ? 700 : 1000}px"></div><div class="grid"></div>
    <div class="wrap">
      <div class="brand">Rota <span>Invisível</span></div>
      <div style="margin-top:${f ? 54 : 50}px">
        <span class="chip" style="font-size:22px;padding:12px 22px">Quiz · 7 perguntas · 2 min</span>
        <h1 style="font-size:${f ? 84 : 98}px;margin-top:30px">Qual renda extra combina com a sua rotina?</h1>
      </div>
      <div style="margin-top:${f ? 46 : 60}px;display:flex;flex-direction:column;gap:${f ? 18 : 24}px">
        <div style="color:#b4b4bc;font-size:${f ? 30 : 36}px;font-weight:700;margin-bottom:6px">Quanto tempo por dia você tem?</div>
        <div class="opt on" style="font-size:${f ? 36 : 42}px;padding:${f ? "26px 30px" : "32px 36px"}">Até 1 hora por dia <span class="dot">✓</span></div>
        <div class="opt" style="font-size:${f ? 36 : 42}px;padding:${f ? "26px 30px" : "32px 36px"}">De 1 a 3 horas</div>
        <div class="opt" style="font-size:${f ? 36 : 42}px;padding:${f ? "26px 30px" : "32px 36px"}">Mais de 3 horas</div>
      </div>
      <div style="flex:1"></div>
      <div><span class="cta" style="font-size:${f ? 34 : 40}px;padding:${f ? "28px 40px" : "34px 48px"}">Descobrir meu caminho →</span></div>
    </div>`,
  // C — objeções
  C: (f) => `
    <div class="glow" style="right:-360px;top:${f ? 200 : 300}px"></div><div class="grid"></div>
    <div class="wrap">
      <div class="brand">Rota <span>Invisível</span></div>
      <div style="margin-top:${f ? 70 : 60}px;display:flex;flex-direction:column;gap:${f ? 30 : 42}px">
        <div class="check" style="font-size:${f ? 50 : 58}px"><i>1h</i>Pouco tempo?</div>
        <div class="check" style="font-size:${f ? 50 : 58}px"><i>R$</i>Pouco dinheiro?</div>
        <div class="check" style="font-size:${f ? 50 : 58}px"><i>?</i>Sem experiência?</div>
      </div>
      <div style="margin-top:${f ? 70 : 90}px">
        <h1 style="font-size:${f ? 80 : 96}px">Ainda assim, existem caminhos <span style="color:#ff6b00">para você.</span></h1>
        <p class="sub" style="font-size:${f ? 34 : 40}px;margin-top:26px">Descubra qual combina com a sua realidade.</p>
      </div>
      <div style="flex:1"></div>
      <div><span class="cta" style="font-size:${f ? 34 : 40}px;padding:${f ? "28px 40px" : "34px 48px"}">Fazer o quiz →</span></div>
    </div>`,
  // D — oferta
  D: (f) => `
    <div class="glow" style="left:50%;transform:translateX(-50%);top:${f ? 380 : 560}px"></div><div class="grid"></div>
    <div class="wrap" style="align-items:center;text-align:center">
      <div class="brand">Rota <span>Invisível</span></div>
      <div class="eyebrow" style="margin-top:${f ? 50 : 40}px">Guia prático + 4 bônus</div>
      <h1 style="font-size:${f ? 72 : 74}px;margin-top:20px">Um mapa para começar sua renda extra com o que você já tem.</h1>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:0;--bw:${f ? 300 : 290}px;position:relative">
        ${book("Rota Invisível", "Guia prático", f ? 300 : 290)}
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:${f ? 34 : 26}px;font-size:${f ? 24 : 28}px;color:#d4d4d8;font-weight:700">
        <span>✓ 30 ideias</span><span>✓ Kit de ferramentas</span><span>✓ Scripts para clientes</span><span>✓ Plano de 30 dias</span>
      </div>
      <div style="font-size:${f ? 30 : 34}px;color:#b4b4bc;font-weight:700">Acesso imediato por</div>
      <div style="font-size:${f ? 104 : 104}px;font-weight:900;letter-spacing:-.04em;line-height:1">R$ 19,90</div>
      <div style="margin-top:${f ? 30 : 28}px"><span class="cta" style="font-size:${f ? 32 : 36}px;padding:${f ? "26px 40px" : "28px 44px"}">Quero meu acesso →</span></div>
    </div>`,
};

const browser = await chromium.launch();
for (const [key, tpl] of Object.entries(ads)) {
  for (const [fmt, w, h] of [["feed-4x5", 1080, 1350], ["stories-9x16", 1080, 1920]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const feed = fmt.startsWith("feed");
    const safe = feed ? "" : ".wrap{padding:270px 76px 400px}";
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>:root{--w:${w}px;--h:${h}px}${css}${safe}</style></head><body>${tpl(feed)}</body></html>`);
    await page.screenshot({ path: path.join(out, `anuncio-${key}-${fmt}.png`) });
    await page.close();
  }
}
await browser.close();
console.log("Criativos gerados em", out);

// Criativos v2 do Traço & Conta no estilo "número gigante + foto + folhas + preço" (feed 4:5 e stories 9:16).
// Se existir marketing/meta-ads/traco-e-conta/foto.png (foto ilustrativa de mãe e filho), ela entra no centro.
// Uso: node marketing/meta-ads/traco-e-conta/gerar-v2.mjs
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../../..");
const img = path.join(root, "public/traco-e-conta/img");
const out = process.env.OUT || path.join(here, "png-v2");
mkdirSync(out, { recursive: true });
const b64 = (f) => `data:image/jpeg;base64,${readFileSync(path.join(img, `folha-${f}.jpg`)).toString("base64")}`;
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(root, "produtos/traco-e-conta/fontes", f)).toString("base64")}`;
const ICONE = readFileSync(path.join(img, "icone.svg"), "utf8");
const fotoPath = path.join(here, "foto.png");
const foto = existsSync(fotoPath) ? `data:image/png;base64,${readFileSync(fotoPath).toString("base64")}` : null;

const css = `@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{width:var(--w);height:var(--h);overflow:hidden;position:relative;font-family:Nunito,"Noto Color Emoji";color:#1e293b;background:#fffbeb;background-image:radial-gradient(#f2e3b6 2px,transparent 2px);background-size:34px 34px}
.wrap{position:absolute;inset:0;padding:var(--pt) 50px var(--pb);display:flex;flex-direction:column;align-items:center;justify-content:center}
.logo{display:flex;align-items:center;gap:12px;font-family:Fredoka;font-weight:700;font-size:38px;background:#fff;border-radius:999px;padding:10px 26px 10px 14px;box-shadow:0 10px 24px -12px rgba(0,0,0,.25)}.logo .ic svg{width:54px;height:54px;display:block}
.a{color:#2563eb}.b{color:#f97316}.c{color:#16a34a}
.num{font-family:Fredoka;font-weight:700;line-height:.86;color:#2563eb;letter-spacing:-.02em;text-shadow:0 8px 0 #1d4ed8,0 18px 30px rgba(29,78,216,.35);-webkit-text-stroke:6px #fff;paint-order:stroke fill}
.word{font-family:Fredoka;font-weight:700;line-height:.9;color:#f97316;text-shadow:0 6px 0 #c2410c;-webkit-text-stroke:3px #fff;paint-order:stroke fill;letter-spacing:.04em;font-kerning:none;font-feature-settings:"kern" 0,"liga" 0}
.stage{position:relative;flex:1;width:100%;min-height:0}
.sheet{position:absolute;border-radius:12px;border:3px solid #fff;box-shadow:0 26px 46px -16px rgba(30,41,59,.55);background:#fff}
.foto{position:absolute;left:50%;transform:translateX(-50%);border-radius:36px;object-fit:cover;object-position:50% 72%;box-shadow:0 30px 60px -24px rgba(30,41,59,.6);border:8px solid #fff}
.band{background:#2563eb;color:#fff;font-family:Fredoka;font-weight:700;border-radius:999px;padding:14px 40px;text-align:center;box-shadow:0 8px 0 #1d4ed8}
.band small{display:block;font-family:Nunito;font-weight:900;font-size:.55em;color:#fde047;letter-spacing:.02em}
.price{background:#fde047;color:#1e293b;font-family:Fredoka;font-weight:700;border-radius:28px;padding:6px 46px;margin-top:18px;box-shadow:0 8px 0 #ca8a04}
.cta{background:#16a34a;color:#fff;font-family:Fredoka;font-weight:700;border-radius:999px;padding:18px 60px;margin-top:18px;box-shadow:0 8px 0 #0f7a35;text-transform:uppercase}`;

const sheet = (f, w, x, y, r, z) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg);z-index:${z}">`;
const logo = `<div class="logo"><span class="ic">${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>`;

const variantes = [
  { id: "V1-280-atividades", num: "280", word: "ATIVIDADES", sheets: ["alfabeto", "contas", "labirinto"], band: "280 atividades em PDF", sub: "Prontas para imprimir · 4 a 8 anos", price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "V2-alfabetizacao", num: "280", word: "ATIVIDADES", sheets: ["silabas", "leitura", "ortografia"], band: "Letras, sílabas e leitura", sub: "e também matemática · com gabarito", price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "V3-completo", num: "+5", word: "BÔNUS", sheets: ["b-ingles", "b-dinheiro", "b-horas"], band: "280 atividades + 5 apostilas", sub: "Inglês · dinheirinho · horas · parede", price: "R$ 17,90", cta: "Quero o completo" },
];
const formats = [
  { tag: "feed-4x5", w: 1080, h: 1350, pt: 40, pb: 44, f: true },
  { tag: "stories-9x16", w: 1080, h: 1920, pt: 190, pb: 270, f: false },
];
const browser = await chromium.launch();
for (const fmt of formats) {
  const p = await browser.newPage({ viewport: { width: fmt.w, height: fmt.h } });
  for (const v of variantes) {
    const f = fmt.f;
    const comFoto = foto && v.id !== "V3-completo";
    const stageH = f ? 470 : 760;
    const sw = f ? 285 : 320;
    const sheetsHtml = comFoto
      ? `<img class="foto" src="${foto}" style="width:${f ? 600 : 760}px;height:${f ? 380 : 560}px;top:0">` +
        sheet(v.sheets[0], f ? 190 : 230, f ? 40 : 30, f ? 180 : 330, -10, 3) + sheet(v.sheets[1], f ? 190 : 230, f ? 750 : 730, f ? 190 : 340, 9, 3)
      : sheet(v.sheets[0], sw, f ? 55 : 45, 40, -10, 2) + sheet(v.sheets[1], sw, f ? 350 : 335, 0, 0, 3) + sheet(v.sheets[2], sw, f ? 645 : 625, 50, 10, 2);
    const html = `${logo}
      <div class="num" style="font-size:${f ? 230 : 280}px;margin-top:${f ? 14 : 30}px">${v.num}</div>
      <div class="word" style="font-size:${f ? 108 : 128}px;margin-top:-6px">${v.word}</div>
      <div class="stage" style="margin-top:${f ? 24 : 40}px;height:${stageH}px;flex:none">${sheetsHtml}</div>
      <div class="band" style="font-size:${f ? 44 : 52}px;margin-top:${f ? 6 : 20}px">${v.band}<small>${v.sub}</small></div>
      <div class="price" style="font-size:${f ? 86 : 104}px">${v.price}</div>
      <div class="cta" style="font-size:${f ? 44 : 52}px">${v.cta} →</div>`;
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--w:${fmt.w}px;--h:${fmt.h}px;--pt:${fmt.pt}px;--pb:${fmt.pb}px"><div class="wrap">${html}</div></body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    const over = await p.evaluate(() => document.querySelector(".wrap").scrollHeight - innerHeight);
    if (over > 2) console.warn(`  ! ${v.id} ${fmt.tag}: passa ${over}px`);
    await p.screenshot({ path: path.join(out, `TC-${v.id}-${fmt.tag}.png`) });
  }
  await p.close();
}
await browser.close();
console.log(`ok (${foto ? "com" : "sem"} foto):`, out);

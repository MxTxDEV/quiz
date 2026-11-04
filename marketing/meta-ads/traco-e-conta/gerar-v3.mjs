// Criativos v3 do Traço & Conta: cena aconchegante em tela cheia (foto), materiais escolares, título 3D,
// folhas reais do kit, faixa da oferta, preço e barra de CTA. Feed 4:5 e stories 9:16.
// Uso: node marketing/meta-ads/traco-e-conta/gerar-v3.mjs   (precisa de foto.png nesta pasta)
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../../..");
const img = path.join(root, "public/traco-e-conta/img");
const out = path.join(here, "png-v3");
mkdirSync(out, { recursive: true });
const b64 = (f) => `data:image/jpeg;base64,${readFileSync(path.join(img, `folha-${f}.jpg`)).toString("base64")}`;
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(root, "produtos/traco-e-conta/fontes", f)).toString("base64")}`;
const ICONE = readFileSync(path.join(img, "icone.svg"), "utf8");
const FOTO = `data:image/png;base64,${readFileSync(path.join(here, "foto.png")).toString("base64")}`;

const css = `@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{width:var(--w);height:var(--h);overflow:hidden;position:relative;font-family:Nunito,"Noto Color Emoji";background:#f7efe2}
.photo{position:absolute;left:0;width:100%;object-fit:cover;filter:saturate(1.08) contrast(1.03)}
.fadeTop{position:absolute;left:0;right:0;top:0;background:linear-gradient(180deg,#fff8ec 0%,#fff8ec 55%,rgba(255,248,236,.0) 100%)}
.fadeBot{position:absolute;left:0;right:0;bottom:0;background:linear-gradient(0deg,rgba(255,248,236,1) 0%,rgba(255,248,236,.97) 55%,rgba(255,248,236,0) 100%)}
.e{position:absolute;font-family:"Noto Color Emoji";line-height:1;filter:drop-shadow(0 10px 12px rgba(80,50,20,.28))}
.paper{position:absolute;border-radius:6px;opacity:.95}
.logo{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;font-family:Fredoka;font-weight:700;font-size:36px;background:#fff;border-radius:999px;padding:10px 26px 10px 14px;box-shadow:0 10px 26px -10px rgba(0,0,0,.3);z-index:6;white-space:nowrap}
.logo .ic svg{width:50px;height:50px;display:block}.a{color:#2563eb}.b{color:#f97316}.c{color:#16a34a}
.title{position:absolute;left:0;right:0;text-align:center;z-index:5}
.num{font-family:Fredoka;font-weight:700;line-height:.85;color:#e11d48;letter-spacing:-.02em;-webkit-text-stroke:10px #fff;paint-order:stroke fill;text-shadow:0 10px 0 #9f1239,0 22px 30px rgba(120,20,40,.35)}
.word{font-family:Fredoka;font-weight:700;line-height:.95;color:#e11d48;-webkit-text-stroke:8px #fff;paint-order:stroke fill;text-shadow:0 8px 0 #9f1239,0 18px 26px rgba(120,20,40,.3);letter-spacing:.03em;font-kerning:none;font-feature-settings:"kern" 0}
.sheet{position:absolute;border-radius:10px;border:4px solid #fff;box-shadow:0 26px 44px -14px rgba(60,30,10,.55);background:#fff;z-index:4}
.band{position:absolute;left:50%;transform:translateX(-50%);z-index:7;text-align:center;white-space:nowrap}
.band .r{display:inline-block;background:#e11d48;color:#fff;font-family:Fredoka;font-weight:700;border-radius:999px;padding:14px 46px;box-shadow:0 8px 0 #9f1239;border:5px solid #fff}
.band .r b{color:#fde047}
.band .w{display:block;width:max-content;margin:-6px auto 0;background:#fff;color:#1e3a8a;font-family:Fredoka;font-weight:700;border-radius:999px;padding:6px 34px;box-shadow:0 8px 20px -8px rgba(0,0,0,.3)}
.price{position:absolute;left:50%;transform:translateX(-50%);z-index:7;background:#fde047;color:#1e3a8a;font-family:Fredoka;font-weight:700;border-radius:999px;padding:4px 60px;box-shadow:0 9px 0 #ca8a04;border:5px solid #fff;white-space:nowrap}
.cta{position:absolute;left:40px;right:40px;z-index:7;background:#16a34a;color:#fff;font-family:Fredoka;font-weight:700;text-align:center;border-radius:28px;box-shadow:0 10px 0 #0f7a35;text-transform:uppercase;letter-spacing:.02em}`;

// materiais escolares (emoji Noto, licença aberta) e papéis coloridos espalhados
const deco = (f) => {
  const items = f
    ? [["✏️", 40, 150, 92, -30], ["🖍️", 930, 120, 96, 25], ["📏", 900, 380, 84, -20], ["⭐", 80, 410, 64, 0], ["🌟", 1000, 300, 50, 0], ["📚", 20, 560, 100, 0], ["✂️", 960, 560, 80, 30], ["🍎", 70, 1010, 84, -10], ["🖍️", 950, 1000, 90, -35], ["⭐", 160, 70, 46, 0]]
    : [["✏️", 40, 260, 110, -30], ["🖍️", 920, 230, 110, 25], ["📏", 900, 640, 96, -20], ["⭐", 70, 700, 76, 0], ["🌟", 1000, 520, 60, 0], ["📚", 20, 900, 110, 0], ["✂️", 960, 940, 92, 30], ["🍎", 70, 1690, 84, -10], ["🖍️", 930, 1690, 92, -35], ["✏️", 470, 1700, 80, 70], ["⭐", 170, 180, 54, 0]];
  const papers = f
    ? [["#fde047", -30, 40, 150, 70, -18], ["#60a5fa", 940, -20, 170, 80, 22], ["#f472b6", 980, 470, 120, 56, -30], ["#4ade80", -40, 470, 130, 60, 26]]
    : [["#fde047", -30, 140, 160, 76, -18], ["#60a5fa", 940, 90, 180, 86, 22], ["#f472b6", 980, 760, 130, 60, -30], ["#4ade80", -40, 780, 140, 64, 26]];
  return papers.map(([c, x, y, w, h, r]) => `<div class="paper" style="background:${c};left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${r}deg);z-index:2"></div>`).join("") +
    items.map(([e, x, y, s, r]) => `<span class="e" style="left:${x}px;top:${y}px;font-size:${s}px;transform:rotate(${r}deg);z-index:3">${e}</span>`).join("");
};
const sheet = (f, w, x, y, r) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg)">`;

const V = [
  { id: "V1-280-atividades", num: "280", word: "ATIVIDADES", s: ["alfabeto", "contas"], r: "<b>280</b> atividades em PDF", w: "Prontas para imprimir · 4 a 8 anos", price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "V2-alfabetizacao", num: "280", word: "ATIVIDADES", s: ["silabas", "leitura"], r: "Letras, sílabas e <b>leitura</b>", w: "E também matemática · com gabarito", price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "V3-completo", num: "+5", word: "BÔNUS", s: ["b-ingles", "b-horas"], r: "<b>280</b> atividades + 5 apostilas", w: "Inglês · dinheirinho · horas · parede", price: "R$ 17,90", cta: "Quero o completo" },
];
const F = [
  // feed: foto em tela cheia; stories: foto ocupa o meio (mesma escala, sem perder nitidez)
  { tag: "feed-4x5", w: 1080, h: 1350, f: true, photoTop: 0, photoH: 1350, fadeTop: 560, fadeBot: 420, logo: 28, title: 92, num: 250, word: 116, sheetY: 955, sheetW: 215, band: 990, price: 1150, cta: [1258, 84], ctaFont: 52 },
  { tag: "stories-9x16", w: 1080, h: 1920, f: false, photoTop: 300, photoH: 1340, fadeTop: 960, fadeBot: 760, logo: 200, title: 285, num: 300, word: 136, sheetY: 1215, sheetW: 245, band: 1250, price: 1415, cta: [1560, 100], ctaFont: 58 },
];
const browser = await chromium.launch();
for (const fm of F) {
  const p = await browser.newPage({ viewport: { width: fm.w, height: fm.h } });
  for (const v of V) {
    const html = `
      <img class="photo" src="${FOTO}" style="top:${fm.photoTop}px;height:${fm.photoH}px;object-position:50% 62%">
      <div class="fadeTop" style="height:${fm.fadeTop}px"></div><div class="fadeBot" style="height:${fm.fadeBot}px"></div>
      ${deco(fm.f)}
      <div class="logo" style="top:${fm.logo}px"><span class="ic">${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>
      <div class="title" style="top:${fm.title}px"><div class="num" style="font-size:${fm.num}px">${v.num}</div><div class="word" style="font-size:${fm.word}px">${v.word}</div></div>
      ${sheet(v.s[0], fm.sheetW, 18, fm.sheetY, -10)}${sheet(v.s[1], fm.sheetW, fm.w - fm.sheetW - 18, fm.sheetY + 10, 9)}
      <div class="band" style="top:${fm.band}px"><span class="r" style="font-size:${fm.f ? 50 : 58}px">${v.r}</span><span class="w" style="font-size:${fm.f ? 28 : 32}px">${v.w}</span></div>
      <div class="price" style="top:${fm.price}px;font-size:${fm.f ? 78 : 92}px">${v.price}</div>
      <div class="cta" style="top:${fm.cta[0]}px;height:${fm.cta[1]}px;line-height:${fm.cta[1]}px;font-size:${fm.ctaFont}px">${v.cta} →</div>`;
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--w:${fm.w}px;--h:${fm.h}px">${html}</body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(out, `TC-${v.id}-${fm.tag}.png`) });
  }
  await p.close();
}
await browser.close();
console.log("ok:", out);

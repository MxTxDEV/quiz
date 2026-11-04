// Criativos v4 do Traço & Conta: foto em destaque (mãe ensinando o filho no papel), outros ângulos de venda.
// Título no topo, foto ancorada embaixo (mostra as mãos e a folha), oferta compacta no rodapé. Feed 4:5 e stories 9:16.
// Uso: node marketing/meta-ads/traco-e-conta/gerar-v4.mjs   (precisa de foto.png nesta pasta)
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../../..");
const img = path.join(root, "public/traco-e-conta/img");
const out = path.join(here, "png-v4");
mkdirSync(out, { recursive: true });
const b64 = (f) => `data:image/jpeg;base64,${readFileSync(path.join(img, `folha-${f}.jpg`)).toString("base64")}`;
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(root, "produtos/traco-e-conta/fontes", f)).toString("base64")}`;
const ICONE = readFileSync(path.join(img, "icone.svg"), "utf8");
const FOTO = `data:image/png;base64,${readFileSync(path.join(here, "foto.png")).toString("base64")}`;
const CREME = "255,248,236";

const css = `@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{width:var(--w);height:var(--h);overflow:hidden;position:relative;font-family:Nunito,"Noto Color Emoji";background:rgb(${CREME})}
.photo{position:absolute;left:0;width:100%;object-fit:cover;object-position:50% 100%;filter:saturate(1.08) contrast(1.03)}
.fade{position:absolute;left:0;right:0;pointer-events:none}
.e{position:absolute;font-family:"Noto Color Emoji";line-height:1;filter:drop-shadow(0 10px 12px rgba(80,50,20,.28));z-index:3}
.paper{position:absolute;border-radius:6px;z-index:2}
.sheet{position:absolute;border-radius:8px;border:4px solid #fff;box-shadow:0 20px 34px -12px rgba(60,30,10,.5);background:#fff;z-index:4}
.logo{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;font-family:Fredoka;font-weight:700;font-size:32px;background:#fff;border-radius:999px;padding:8px 22px 8px 12px;box-shadow:0 10px 26px -10px rgba(0,0,0,.3);z-index:6;white-space:nowrap}
.logo .ic svg{width:44px;height:44px;display:block}.a{color:#2563eb}.b{color:#f97316}.c{color:#16a34a}
.title{position:absolute;left:40px;right:40px;text-align:center;z-index:5}
.big{display:inline-block;font-family:Fredoka;font-weight:700;line-height:.95;color:var(--c);-webkit-text-stroke:9px #fff;paint-order:stroke fill;text-shadow:0 9px 0 var(--d),0 20px 28px rgba(60,20,20,.3);letter-spacing:.02em;font-kerning:none;font-feature-settings:"kern" 0;white-space:nowrap}
.small{display:inline-block;font-family:Fredoka;font-weight:700;color:#1e3a8a;-webkit-text-stroke:6px #fff;paint-order:stroke fill;text-shadow:0 6px 14px rgba(0,0,0,.18);margin-top:6px}
.band{position:absolute;left:50%;transform:translateX(-50%);z-index:7;white-space:nowrap;background:var(--c);color:#fff;font-family:Fredoka;font-weight:700;border-radius:999px;padding:12px 40px;box-shadow:0 7px 0 var(--d);border:5px solid #fff}
.row{position:absolute;left:40px;right:40px;z-index:7;display:flex;gap:18px;align-items:center}
.price{background:#fde047;color:#1e3a8a;font-family:Fredoka;font-weight:700;border-radius:26px;padding:0 30px;box-shadow:0 8px 0 #ca8a04;border:5px solid #fff;white-space:nowrap;display:flex;align-items:center}
.cta{flex:1;background:#16a34a;color:#fff;font-family:Fredoka;font-weight:700;text-align:center;border-radius:26px;box-shadow:0 8px 0 #0f7a35;text-transform:uppercase;border:5px solid #fff;white-space:nowrap}`;

const sheet = (f, w, x, y, r) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg)">`;
const decoFeed = [["⭐", 230, 40, 44, 0], ["🌟", 820, 40, 40, 0]];
const decoStory = [["⭐", 240, 210, 50, 0], ["🌟", 800, 210, 46, 0], ["📚", 60, 1680, 80, 0], ["🍎", 940, 1690, 70, -10]];
const deco = (items) => items.map(([e, x, y, s, r]) => `<span class="e" style="left:${x}px;top:${y}px;font-size:${s}px;transform:rotate(${r}deg)">${e}</span>`).join("");

const RED = ["#e11d48", "#9f1239"], BLUE = ["#2563eb", "#1e40af"], ORANGE = ["#ea580c", "#9a3412"], GREEN = ["#16a34a", "#166534"];
const V = [
  { id: "A-menos-tela", c: RED, big: "MENOS TELA", small: "e mais tempo juntos", band: "280 atividades para fazer juntos", s: ["motora", "labirinto"], price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "B-ler-e-escrever", c: BLUE, big: "LER E ESCREVER", small: "aprendendo junto, em casa", band: "Letras, sílabas, palavras e textos", s: ["alfabeto", "silabas"], price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "C-reforco-em-casa", c: ORANGE, big: "REFORÇO", small: "em casa, no seu ritmo", band: "O que a escola ensina, praticado em casa", s: ["leitura", "contas"], price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "D-imprima-hoje", c: GREEN, big: "IMPRIMA HOJE", small: "e use ainda hoje", band: "PDF com acesso imediato por e-mail", s: ["ortografia", "caca"], price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "E-4-centavos", c: RED, big: "280 POR R$ 10", small: "menos de 4 centavos por atividade", band: "Alfabetização e matemática · 4 a 8 anos", s: ["complexas", "numeros"], price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "F-numeros", c: BLUE, big: "1, 2, 3...", small: "contar ficou divertido", band: "Números, continhas e sequências", s: ["quantidades", "sequencia"], price: "R$ 10,00", cta: "Quero meu kit" },
  { id: "G-completo", c: GREEN, big: "+5 BÔNUS", small: "para aprender o ano todo", band: "280 atividades + 5 apostilas", s: ["b-ingles", "b-dinheiro"], price: "R$ 17,90", cta: "Quero o completo" },
];
const F = [
  { tag: "feed-4x5", w: 1080, h: 1350, logo: 22, sheetY: 18, sheetW: 150, title: 104, big: 140, small: 52, photo: [270, 870], fadeTop: [270, 230], fadeBot: [1000, 140], band: 1080, row: [1196, 108], bandF: 38, rowF: [62, 46], deco: decoFeed },
  { tag: "stories-9x16", w: 1080, h: 1920, logo: 200, sheetY: 170, sheetW: 170, title: 300, big: 150, small: 56, photo: [520, 980], fadeTop: [520, 230], fadeBot: [1370, 140], band: 1440, row: [1556, 112], bandF: 40, rowF: [66, 48], deco: decoStory },
];

const browser = await chromium.launch();
for (const fm of F) {
  const p = await browser.newPage({ viewport: { width: fm.w, height: fm.h } });
  for (const v of V) {
    const html = `
      <img class="photo" src="${FOTO}" style="top:${fm.photo[0]}px;height:${fm.photo[1]}px">
      <div class="fade" style="top:${fm.fadeTop[0]}px;height:${fm.fadeTop[1]}px;background:linear-gradient(180deg,rgb(${CREME}),rgba(${CREME},0));z-index:1"></div>
      <div class="fade" style="top:${fm.fadeBot[0]}px;height:${fm.h - fm.fadeBot[0]}px;background:linear-gradient(180deg,rgba(${CREME},0),rgb(${CREME}) ${fm.fadeBot[1]}px);z-index:1"></div>
      <div class="paper" style="background:#fde047;left:-30px;top:${fm.sheetY + 200}px;width:130px;height:60px;transform:rotate(-20deg)"></div>
      <div class="paper" style="background:#60a5fa;left:${fm.w - 110}px;top:${fm.sheetY + 210}px;width:140px;height:60px;transform:rotate(22deg)"></div>
      ${deco(fm.deco)}
      ${sheet(v.s[0], fm.sheetW, 20, fm.sheetY, -10)}${sheet(v.s[1], fm.sheetW, fm.w - fm.sheetW - 20, fm.sheetY + 6, 9)}
      <div class="logo" style="top:${fm.logo}px"><span class="ic">${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>
      <div class="title" style="top:${fm.title}px;--c:${v.c[0]};--d:${v.c[1]}"><span class="big" style="font-size:${fm.big}px">${v.big}</span><br><span class="small" style="font-size:${fm.small}px">${v.small}</span></div>
      <div class="band" style="top:${fm.band}px;font-size:${fm.bandF}px;--c:${v.c[0]};--d:${v.c[1]}">${v.band}</div>
      <div class="row" style="top:${fm.row[0]}px;height:${fm.row[1]}px"><div class="price" style="height:100%;font-size:${fm.rowF[0]}px">${v.price}</div><div class="cta" style="height:100%;line-height:${fm.row[1] - 10}px;font-size:${fm.rowF[1]}px">${v.cta} →</div></div>`;
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--w:${fm.w}px;--h:${fm.h}px">${html}</body></html>`);
    await p.evaluate(() => document.fonts.ready);
    // encaixa título, faixa e botão na largura disponível
    await p.evaluate(() => {
      const fit = (el, max) => { let s = parseFloat(getComputedStyle(el).fontSize); while (el.getBoundingClientRect().width > max && s > 10) { s -= 2; el.style.fontSize = s + "px"; } };
      fit(document.querySelector(".big"), innerHeight > 1500 ? 720 : 740); fit(document.querySelector(".small"), 900); fit(document.querySelector(".band"), 1010);
      const cta = document.querySelector(".cta"); let s = parseFloat(getComputedStyle(cta).fontSize); while (cta.scrollWidth > cta.clientWidth && s > 10) { s -= 2; cta.style.fontSize = s + "px"; }
    });
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(out, `TC-${v.id}-${fm.tag}.png`) });
  }
  await p.close();
}
await browser.close();
console.log("ok:", out);

// Criativos v5 do Traço & Conta: composição infantil e colorida (papéis rasgados, giz, rabiscos), título 3D,
// foto mesclada ao fundo, capa do kit + folhas reais, faixa, preço com raios e barra de CTA. Feed 4:5 e stories 9:16.
// Uso: node marketing/meta-ads/traco-e-conta/gerar-v5.mjs   (precisa de foto.png nesta pasta)
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../../..");
const img = path.join(root, "public/traco-e-conta/img");
const out = path.join(here, "png-v5");
mkdirSync(out, { recursive: true });
const b64 = (f) => `data:image/jpeg;base64,${readFileSync(path.join(img, `folha-${f}.jpg`)).toString("base64")}`;
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(root, "produtos/traco-e-conta/fontes", f)).toString("base64")}`;
const ICONE = readFileSync(path.join(img, "icone.svg"), "utf8");
const FOTO = `data:image/png;base64,${readFileSync(path.join(here, "foto.png")).toString("base64")}`;

const css = `@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}@font-face{font-family:Nunito;font-weight:800;src:url(${font("nunito-latin-800-normal.woff2")})}
*{margin:0;box-sizing:border-box}body{width:var(--w);height:var(--h);overflow:hidden;position:relative;font-family:Nunito,"Noto Color Emoji";background:#fffdf8}
.abs{position:absolute}
.torn{position:absolute;z-index:1;filter:drop-shadow(0 6px 8px rgba(0,0,0,.18))}
.e{position:absolute;font-family:"Noto Color Emoji";line-height:1;filter:drop-shadow(0 8px 10px rgba(0,0,0,.25));z-index:2}
.doodle{position:absolute;z-index:2;fill:none;stroke-linecap:round;stroke-linejoin:round}
.photo{position:absolute;object-fit:cover;object-position:50% 78%;z-index:3;-webkit-mask-image:radial-gradient(ellipse 50% 50% at 50% 52%,#000 62%,transparent 100%);mask-image:radial-gradient(ellipse 50% 50% at 50% 52%,#000 62%,transparent 100%)}
.logo{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;font-family:Fredoka;font-weight:700;background:#fff;border-radius:999px;padding:8px 24px 8px 12px;box-shadow:0 8px 22px -8px rgba(0,0,0,.3);z-index:9;white-space:nowrap;border:4px solid #fde047}
.logo .ic svg{width:100%;height:100%;display:block}.a{color:#2563eb}.b{color:#f97316}.c{color:#16a34a}
.t{position:absolute;left:50%;transform:translateX(-50%);width:max-content;text-align:center;z-index:6;font-family:Fredoka;font-weight:700;color:#e11d48;line-height:.84;-webkit-text-stroke:var(--sw) #fff;paint-order:stroke fill;text-shadow:0 var(--sh) 0 #9f1239,0 calc(var(--sh) * 2) 26px rgba(120,20,40,.35);font-kerning:none;font-feature-settings:"kern" 0;white-space:nowrap}
.cover{position:absolute;z-index:7;background:#fffbea;border-radius:12px;border:4px solid #fff;box-shadow:0 22px 40px -12px rgba(60,30,10,.55);padding:18px 16px;display:flex;flex-direction:column;align-items:center}
.cover .dots{display:flex;gap:7px;justify-content:center}.cover .dots i{width:13px;height:13px;border-radius:50%;display:block}
.cover .k{font-family:Fredoka;font-weight:700;color:#1e3a8a;text-align:center;line-height:1.02;font-kerning:none;font-feature-settings:"kern" 0}
.cover .pills{display:grid;grid-template-columns:1fr 1fr;gap:6px;width:100%}
.cover .pills span{color:#fff;font-weight:900;border-radius:999px;text-align:center;padding:4px 2px;white-space:nowrap}
.sheet{position:absolute;border-radius:10px;border:4px solid #fff;box-shadow:0 22px 40px -12px rgba(60,30,10,.55);background:#fff;z-index:7}
.ribbon{position:absolute;left:50%;transform:translateX(-50%);z-index:10;white-space:nowrap;background:#e11d48;color:#fff;font-family:Fredoka;font-weight:700;border-radius:999px;box-shadow:0 8px 0 #9f1239;border:6px solid #fff}
.ribbon b{color:#fde047}
.sub{position:absolute;left:50%;transform:translateX(-50%);z-index:10;white-space:nowrap;background:#fff;color:#1e3a8a;font-family:Fredoka;font-weight:700;border-radius:999px;box-shadow:0 8px 18px -6px rgba(0,0,0,.25)}
.price{position:absolute;left:50%;transform:translateX(-50%);z-index:10;white-space:nowrap;background:#fde047;color:#1e3a8a;font-family:Fredoka;font-weight:700;border-radius:999px;box-shadow:0 8px 0 #ca8a04;border:6px solid #fff}
.cta{position:absolute;z-index:10;background:#e11d48;color:#fff;font-family:Fredoka;font-weight:700;text-align:center;border-radius:999px;box-shadow:0 9px 0 #9f1239;border:6px solid #fff;white-space:nowrap}`;

// papéis rasgados (polígonos irregulares)
const torn = (x, y, w, h, r, color, seed) => {
  let s = seed; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const pts = [];
  for (let i = 0; i <= 10; i++) pts.push(`${i * 10}% ${rnd() * 14}%`);
  for (let i = 10; i >= 0; i--) pts.push(`${i * 10}% ${86 + rnd() * 14}%`);
  return `<div class="torn" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${r}deg)"><div style="width:100%;height:100%;background:${color};clip-path:polygon(${pts.join(",")})"></div></div>`;
};
const star = (x, y, s, c, r = 0) => `<svg class="doodle" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z" stroke="${c}" stroke-width="7"/></svg>`;
const heart = (x, y, s, c, r = 0) => `<svg class="doodle" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 86 C 18 64, 6 42, 20 26 C 32 14, 46 20, 50 32 C 54 20, 68 14, 80 26 C 94 42, 82 64, 50 86 Z" stroke="${c}" stroke-width="7"/></svg>`;
const spiral = (x, y, s, c) => `<svg class="doodle" style="left:${x}px;top:${y}px" width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M50 50 m0 0 a6 6 0 1 1 12 0 a12 12 0 1 1 -24 0 a18 18 0 1 1 36 0 a24 24 0 1 1 -48 0 a30 30 0 1 1 60 0" stroke="${c}" stroke-width="5"/></svg>`;
const zig = (x, y, w, c, r = 0) => `<svg class="doodle" style="left:${x}px;top:${y}px;transform:rotate(${r}deg)" width="${w}" height="40" viewBox="0 0 120 40"><path d="M4 30 L22 8 L40 30 L58 8 L76 30 L94 8 L112 30" stroke="${c}" stroke-width="6"/></svg>`;
const rays = (x, y, flip, c = "#f59e0b") => `<svg class="doodle" style="left:${x}px;top:${y}px;transform:scaleX(${flip ? -1 : 1});z-index:9" width="70" height="90" viewBox="0 0 70 90"><path d="M64 45 L10 45 M60 30 L16 8 M60 60 L16 82" stroke="${c}" stroke-width="9"/></svg>`;
const sheet = (f, w, x, y, r) => `<img class="sheet" src="${b64(f)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${r}deg)">`;

const cover = (x, y, w, r, titulo, itens) => {
  const cores = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
  const dots = `<div class="dots">${cores.map((c) => `<i style="background:${c}"></i>`).join("")}</div>`;
  return `<div class="cover" style="left:${x}px;top:${y}px;width:${w}px;transform:rotate(${r}deg);gap:${w * 0.04}px">${dots}
    <div style="display:flex;align-items:center;gap:6px;font-family:Fredoka;font-weight:700;font-size:${w * 0.085}px"><span style="width:${w * 0.12}px;height:${w * 0.12}px;display:block">${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>
    <div class="k" style="font-size:${w * 0.105}px">${titulo}</div>
    <div style="font-weight:900;color:#475569;font-size:${w * 0.045}px;text-align:center">Alfabetização e matemática · para imprimir</div>
    <div class="pills" style="font-size:${w * 0.042}px">${itens.map((t, i) => `<span style="background:${cores[i % cores.length]}">${t}</span>`).join("")}</div>
    ${dots}</div>`;
};
const ITENS = ["Alfabeto", "Sílabas", "Leitura", "Números", "Continhas", "Labirintos"];

const V = [
  { id: "V1-basico", num: "280", word: "ATIVIDADES", cover: "KIT DE 280<br>ATIVIDADES", s: ["alfabeto", "contas"], ribbon: "<b>280</b> atividades em PDF", sub: "Prontas para imprimir", price: "R$ 10,00", cta: "QUERO MEU KIT" },
  { id: "V2-alfabetizacao", num: "280", word: "ATIVIDADES", cover: "KIT DE 280<br>ATIVIDADES", s: ["silabas", "leitura"], ribbon: "Letras, sílabas e <b>leitura</b>", sub: "E também matemática · 4 a 8 anos", price: "R$ 10,00", cta: "QUERO MEU KIT" },
  { id: "V3-completo", num: "280", word: "+ 5 BÔNUS", cover: "KIT COMPLETO<br>+ 5 BÔNUS", s: ["b-ingles", "b-horas"], ribbon: "<b>280</b> atividades + 5 apostilas", sub: "Inglês · dinheirinho · horas · parede", price: "R$ 17,90", cta: "QUERO O COMPLETO" },
];

const L = {
  feed: { w: 1080, h: 1350, logo: [22, 32], num: [70, 250], word: [292, 132], photo: [90, 360, 900, 600], cover: [40, 715, 300, -5], s1: [370, 760, 300, 2], s2: [690, 750, 300, 6],
    ribbon: [1022, 54, "14px 48px"], sub: [1104, 36, "6px 34px"], price: [1150, 74, "0 62px"], cta: [1262, 72, 48],
    torn: [[-40, -20, 240, 120, -16, "#ef4444"], [880, -30, 260, 130, 14, "#3b82f6"], [-60, 600, 200, 110, 70, "#fde047"], [960, 560, 200, 110, -68, "#2dd4bf"], [-50, 1180, 220, 120, 20, "#f97316"], [920, 1200, 240, 120, -18, "#a855f7"]],
    emo: [["🖍️", 40, 150, 80, -30], ["✏️", 940, 150, 80, 30], ["🖍️", 10, 470, 70, 60], ["✂️", 990, 450, 66, 20], ["📏", 20, 980, 70, -40], ["🖍️", 990, 1000, 72, -60]],
    doo: () => star(190, 120, 60, "#f97316", -12) + heart(840, 120, 58, "#e11d48", 10) + spiral(70, 330, 70, "#2563eb") + zig(930, 330, 110, "#22c55e", -10) + star(960, 680, 50, "#eab308", 15) + heart(30, 690, 50, "#ec4899", -15),
    rays: [[200, 1150], [810, 1150]] },
  stories: { w: 1080, h: 1920, logo: [200, 34], num: [270, 280], word: [520, 146], photo: [70, 600, 940, 680], cover: [40, 1060, 320, -5], s1: [370, 1120, 310, 2], s2: [695, 1110, 310, 6],
    ribbon: [1340, 58, "14px 50px"], sub: [1428, 38, "6px 36px"], price: [1480, 84, "0 66px"], cta: [1588, 82, 54],
    torn: [[-40, 110, 240, 120, -16, "#ef4444"], [880, 100, 260, 130, 14, "#3b82f6"], [-60, 850, 200, 110, 70, "#fde047"], [960, 820, 200, 110, -68, "#2dd4bf"], [-50, 1700, 220, 120, 20, "#f97316"], [920, 1720, 240, 120, -18, "#a855f7"], [380, 1760, 300, 110, 4, "#fde047"]],
    emo: [["🖍️", 40, 330, 86, -30], ["✏️", 940, 330, 86, 30], ["🖍️", 10, 720, 76, 60], ["✂️", 990, 700, 70, 20], ["📏", 20, 1300, 74, -40], ["🖍️", 990, 1300, 76, -60], ["🍎", 110, 1730, 80, -10], ["📚", 860, 1720, 86, 0]],
    doo: () => star(190, 260, 64, "#f97316", -12) + heart(840, 260, 62, "#e11d48", 10) + spiral(60, 560, 74, "#2563eb") + zig(930, 560, 110, "#22c55e", -10) + star(960, 980, 54, "#eab308", 15) + heart(30, 990, 54, "#ec4899", -15),
    rays: [[190, 1482], [820, 1482]] },
};

const browser = await chromium.launch();
for (const [tag, k] of Object.entries(L)) {
  const p = await browser.newPage({ viewport: { width: k.w, height: k.h } });
  for (const v of V) {
    const html = `
      ${k.torn.map((t, i) => torn(...t, i * 37 + 11)).join("")}
      ${k.emo.map(([e, x, y, s, r]) => `<span class="e" style="left:${x}px;top:${y}px;font-size:${s}px;transform:rotate(${r}deg)">${e}</span>`).join("")}
      ${k.doo()}
      <img class="photo" src="${FOTO}" style="left:${k.photo[0]}px;top:${k.photo[1]}px;width:${k.photo[2]}px;height:${k.photo[3]}px">
      <div class="logo" style="top:${k.logo[0]}px;font-size:${k.logo[1]}px"><span class="ic" style="width:${k.logo[1] * 1.4}px;height:${k.logo[1] * 1.4}px">${ICONE}</span><span><span class="a">Traço</span> <span class="b">&amp;</span> <span class="c">Conta</span></span></div>
      <div class="t" style="top:${k.num[0]}px;font-size:${k.num[1]}px;--sw:12px;--sh:12px">${v.num}</div>
      <div class="t word" style="top:${k.word[0] + (v.id.includes("completo") ? 26 : 0)}px;font-size:${k.word[1]}px;--sw:${v.id.includes("completo") ? 4 : 9}px;--sh:9px;letter-spacing:${v.id.includes("completo") ? ".06em" : ".02em"}">${v.word}</div>
      ${cover(k.cover[0], k.cover[1], k.cover[2], k.cover[3], v.cover, ITENS)}
      ${sheet(v.s[0], k.s1[2], k.s1[0], k.s1[1], k.s1[3])}${sheet(v.s[1], k.s2[2], k.s2[0], k.s2[1], k.s2[3])}
      <div class="ribbon" style="top:${k.ribbon[0]}px;font-size:${k.ribbon[1]}px;padding:${k.ribbon[2]}">${v.ribbon}</div>
      <div class="sub" style="top:${k.sub[0]}px;font-size:${k.sub[1]}px;padding:${k.sub[2]}">${v.sub}</div>
      ${k.rays.map(([x, y], i) => rays(x, y, i === 1)).join("")}
      <div class="price" style="top:${k.price[0]}px;font-size:${k.price[1]}px;padding:${k.price[2]}">${v.price}</div>
      <div class="cta" style="top:${k.cta[0]}px;left:60px;right:60px;height:${k.cta[1] + 12}px;line-height:${k.cta[1]}px;font-size:${k.cta[2]}px">${v.cta}</div>`;
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--w:${k.w}px;--h:${k.h}px">${html}</body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => { // encaixa textos longos
      const fit = (el, max) => { let s = parseFloat(getComputedStyle(el).fontSize); while (el.getBoundingClientRect().width > max && s > 10) { s -= 2; el.style.fontSize = s + "px"; } };
      fit(document.querySelector(".word"), 980); document.querySelectorAll(".ribbon,.sub").forEach((e) => fit(e, 1000));
     
    });
    await p.waitForTimeout(150);
    await p.screenshot({ path: path.join(out, `TC-${v.id}-${tag === "feed" ? "feed-4x5" : "stories-9x16"}.png`) });
  }
  await p.close();
}
await browser.close();
console.log("ok:", out);

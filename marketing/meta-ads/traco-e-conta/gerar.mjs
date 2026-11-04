// 8 criativos do kit Traço & Conta — feed 4:5 (1080×1350) e stories/reels 9:16 (1080×1920).
// Só mostram folhas reais do kit e afirmações verdadeiras (sem preço riscado, sem escassez, sem depoimento).
// Uso: node marketing/meta-ads/traco-e-conta/gerar.mjs   (rode antes: node produtos/traco-e-conta/marca.mjs)
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../../..");
const imgDir = path.join(root, "public/traco-e-conta/img");
const out = path.join(here, "png");
mkdirSync(out, { recursive: true });
const b64 = (f, t = "jpeg") => `data:image/${t};base64,${readFileSync(path.join(imgDir, f)).toString("base64")}`;
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(root, "produtos/traco-e-conta/fontes", f)).toString("base64")}`;
const ICONE = readFileSync(path.join(imgDir, "icone.svg"), "utf8");

const folha = (f, { w, x, y, rot = 0, z = 1 }) => `<img class="sheet" src="${b64(`folha-${f}.jpg`)}" style="width:${w}px;left:${x}px;top:${y}px;transform:rotate(${rot}deg);z-index:${z}">`;
const logo = `<div class="logo"><span class="ic">${ICONE}</span><span><b class="a">Traço</b> <b class="b">&amp;</b> <b class="c">Conta</b></span></div>`;
const cta = (t = "Quero o kit") => `<div class="ctaRow"><span class="cta">${t} →</span><span class="price">R$ 10,00<small>pagamento único · PDF</small></span></div>`;

const css = `
@font-face{font-family:Fredoka;font-weight:600;src:url(${font("fredoka-latin-600-normal.woff2")})}@font-face{font-family:Fredoka;font-weight:700;src:url(${font("fredoka-latin-700-normal.woff2")})}
@font-face{font-family:Nunito;font-weight:800;src:url(${font("nunito-latin-800-normal.woff2")})}@font-face{font-family:Nunito;font-weight:900;src:url(${font("nunito-latin-900-normal.woff2")})}
*{box-sizing:border-box;margin:0}
body{width:var(--w);height:var(--h);overflow:hidden;position:relative;font-family:Nunito,"Noto Color Emoji";color:#1e293b;background:#fffbeb;background-image:radial-gradient(#f2e3b6 2px,transparent 2px);background-size:34px 34px}
.wrap{position:absolute;inset:0;padding:var(--pt) 70px var(--pb);display:flex;flex-direction:column}
.logo{display:flex;align-items:center;gap:14px;font-family:Fredoka;font-weight:700;font-size:40px}.logo .ic{width:58px;height:58px;display:block}.logo .ic svg{width:100%;height:100%}
.logo .a{color:#2563eb}.logo .b{color:#f97316}.logo .c{color:#16a34a}
h1{font-family:Fredoka;font-weight:700;letter-spacing:-.015em;line-height:1.02;margin-top:28px}
h1 .bl{color:#2563eb}h1 .gr{color:#16a34a}h1 .or{color:#f97316}h1 mark{background:linear-gradient(transparent 58%,#fde68a 58%);color:inherit;padding:0 .06em}
.sub{font-weight:800;color:#475569;margin-top:16px;line-height:1.3}
.stage{position:relative;flex:1;min-height:0}
.sheet{position:absolute;border-radius:14px;border:2px solid #e2e8f0;box-shadow:0 30px 60px -22px rgba(30,41,59,.5);background:#fff}
.badge{position:absolute;z-index:9;font-family:Fredoka;font-weight:700;color:#fff;border-radius:999px;padding:14px 26px;font-size:34px;box-shadow:0 12px 26px -10px rgba(0,0,0,.35)}
.ctaRow{display:flex;align-items:center;gap:26px;margin-top:18px}
.cta{background:#16a34a;color:#fff;font-family:Fredoka;font-weight:700;font-size:40px;text-transform:uppercase;border-radius:999px;padding:26px 44px;box-shadow:0 9px 0 #0f7a35}
.price{font-family:Fredoka;font-weight:700;font-size:56px;color:#16a34a;line-height:1;display:flex;flex-direction:column}.price small{font-family:Nunito;font-weight:800;font-size:20px;color:#64748b;margin-top:8px;text-transform:uppercase;letter-spacing:.06em}
.chips{display:flex;flex-wrap:wrap;gap:12px;margin-top:20px}.chips span{background:#fff;border:3px solid #fde68a;border-radius:999px;padding:10px 20px;font-weight:900;font-size:26px}
.legal{font-weight:800;font-size:17px;color:#94a3b8;margin-top:16px}
`;

// f = feed (true) ou stories (false); W = largura útil 940
const ads = [
  { id: "01-280-atividades", html: (f) => `${logo}<h1 style="font-size:${f ? 96 : 112}px"><span class="bl">280 atividades</span><br>para imprimir<br>por <mark>R$ 10</mark></h1><div class="sub" style="font-size:${f ? 34 : 38}px">Alfabetização e matemática · 4 a 8 anos</div>
      <div class="stage">${folha("alfabeto", { w: f ? 300 : 360, x: 0, y: f ? 50 : 120, rot: -8, z: 2 })}${folha("contas", { w: f ? 300 : 360, x: f ? 310 : 290, y: f ? 20 : 70, rot: 1, z: 3 })}${folha("labirinto", { w: f ? 300 : 360, x: f ? 620 : 580, y: f ? 60 : 140, rot: 8, z: 2 })}
      <span class="badge" style="background:#f97316;right:0;top:${f ? -10 : 20}px">com gabarito</span></div>${cta()}` },
  { id: "02-veja-por-dentro", html: (f) => `${logo}<h1 style="font-size:${f ? 92 : 108}px">Veja como são<br><span class="gr">as folhas</span> por dentro</h1><div class="sub" style="font-size:${f ? 32 : 36}px">Folhas reais do kit, do jeito que você vai imprimir.</div>
      <div class="stage">${folha("silabas", { w: f ? 420 : 470, x: 0, y: f ? 30 : 80, rot: -4, z: 2 })}${folha("leitura", { w: f ? 420 : 470, x: f ? 500 : 470, y: f ? 60 : 160, rot: 5, z: 3 })}</div>${cta("Ver o kit")}` },
  { id: "03-planejamento-pronto", html: (f) => `${logo}<h1 style="font-size:${f ? 90 : 106}px">Planejamento<br>da semana <span class="bl">pronto</span><br>em 5 minutos</h1><div class="sub" style="font-size:${f ? 32 : 36}px">Atividades organizadas por tema: é só escolher, imprimir e aplicar.</div>
      <div class="stage">${folha("ortografia", { w: f ? 290 : 340, x: 0, y: f ? 40 : 90, rot: -6, z: 2 })}${folha("numeros", { w: f ? 290 : 340, x: f ? 325 : 300, y: f ? 10 : 50, rot: 0, z: 3 })}${folha("caca", { w: f ? 290 : 340, x: f ? 650 : 600, y: f ? 50 : 110, rot: 6, z: 2 })}</div>
      <div class="chips"><span>🔤 Alfabeto</span><span>🧩 Sílabas</span><span>➕ Continhas</span><span>🌀 Labirintos</span></div>${cta()}` },
  { id: "04-do-a-ao-z", html: (f) => `${logo}<h1 style="font-size:${f ? 96 : 112}px">Do <span class="or">A</span> ao <span class="gr">Z</span>,<br>da letra à<br><mark>primeira leitura</mark></h1><div class="sub" style="font-size:${f ? 32 : 36}px">Letras, famílias silábicas, sílabas complexas, ortografia e 20 textos curtos.</div>
      <div class="stage">${folha("alfabeto", { w: f ? 360 : 420, x: 40, y: f ? 30 : 80, rot: -5, z: 2 })}${folha("complexas", { w: f ? 360 : 420, x: f ? 520 : 480, y: f ? 50 : 140, rot: 5, z: 3 })}</div>${cta()}` },
  { id: "05-continhas", html: (f) => `${logo}<h1 style="font-size:${f ? 92 : 108}px">Continhas que<br>parecem <span class="gr">brincadeira</span></h1><div class="sub" style="font-size:${f ? 32 : 36}px">Contar, somar, tirar, sequências, labirintos e caça-palavras.</div>
      <div class="stage">${folha("contas", { w: f ? 300 : 350, x: 0, y: f ? 40 : 100, rot: -7, z: 2 })}${folha("sequencia", { w: f ? 300 : 350, x: f ? 320 : 295, y: f ? 10 : 50, rot: 0, z: 3 })}${folha("quantidades", { w: f ? 300 : 350, x: f ? 640 : 590, y: f ? 50 : 120, rot: 7, z: 2 })}</div>${cta()}` },
  { id: "06-menos-tela", html: (f) => `${logo}<h1 style="font-size:${f ? 100 : 116}px">Menos tela,<br><span class="or">mais lápis.</span></h1><div class="sub" style="font-size:${f ? 34 : 38}px">Atividades curtas e coloridas para fazer à mesa, em casa ou na escola.</div>
      <div class="stage">${folha("motora", { w: f ? 330 : 380, x: 20, y: f ? 50 : 110, rot: -6, z: 2 })}${folha("desenho", { w: f ? 330 : 380, x: f ? 300 : 280, y: f ? 10 : 40, rot: 2, z: 3 })}${folha("labirinto", { w: f ? 330 : 380, x: f ? 590 : 550, y: f ? 60 : 130, rot: 8, z: 2 })}</div>${cta()}` },
  { id: "07-imprima-quantas-vezes", html: (f) => `${logo}<h1 style="font-size:${f ? 90 : 106}px">Pague <mark>uma vez</mark>,<br>imprima <span class="bl">quantas<br>vezes quiser</span></h1><div class="sub" style="font-size:${f ? 32 : 36}px">PDF para casa ou para a turma inteira. Acesso imediato por e-mail.</div>
      <div class="stage">${folha("escrita", { w: f ? 300 : 350, x: 0, y: f ? 40 : 100, rot: -7, z: 2 })}${folha("separar", { w: f ? 300 : 350, x: f ? 320 : 295, y: f ? 10 : 50, rot: 0, z: 3 })}${folha("formas", { w: f ? 300 : 350, x: f ? 640 : 590, y: f ? 50 : 120, rot: 7, z: 2 })}</div>${cta()}` },
  { id: "08-kit-completo", html: (f) => `${logo}<h1 style="font-size:${f ? 90 : 106}px">280 atividades<br><span class="gr">+ 5 apostilas bônus</span></h1><div class="sub" style="font-size:${f ? 32 : 36}px">Inglês, dinheirinho, horas, sondagem de escrita e material de parede.</div>
      <div class="stage">${folha("b-ingles", { w: f ? 250 : 290, x: 0, y: f ? 50 : 110, rot: -9, z: 2 })}${folha("b-dinheiro", { w: f ? 250 : 290, x: f ? 230 : 215, y: f ? 20 : 60, rot: -3, z: 3 })}${folha("b-horas", { w: f ? 250 : 290, x: f ? 460 : 430, y: f ? 30 : 80, rot: 3, z: 4 })}${folha("b-parede", { w: f ? 250 : 290, x: f ? 690 : 650, y: f ? 60 : 130, rot: 9, z: 3 })}</div>
      <div class="ctaRow"><span class="cta">Quero o completo →</span><span class="price">R$ 17,90<small>pagamento único · PDF</small></span></div>` },
];

const formats = [
  { tag: "feed-4x5", w: 1080, h: 1350, pt: 60, pb: 60, f: true },
  { tag: "stories-9x16", w: 1080, h: 1920, pt: 210, pb: 290, f: false },
];
const browser = await chromium.launch();
for (const fmt of formats) {
  const p = await browser.newPage({ viewport: { width: fmt.w, height: fmt.h } });
  for (const ad of ads) {
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body style="--w:${fmt.w}px;--h:${fmt.h}px;--pt:${fmt.pt}px;--pb:${fmt.pb}px"><div class="wrap">${ad.html(fmt.f)}</div></body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(150);
    // encaixa as folhas no espaço livre (encolhe proporcionalmente e centraliza se passarem do palco)
    await p.evaluate(() => {
      const st = document.querySelector(".stage"); const sr = st.getBoundingClientRect();
      const sh = [...st.querySelectorAll(".sheet")];
      const maxB = Math.max(...sh.map((e) => e.getBoundingClientRect().bottom - sr.top));
      const minL = Math.min(...sh.map((e) => e.getBoundingClientRect().left - sr.left));
      const maxR = Math.max(...sh.map((e) => e.getBoundingClientRect().right - sr.left));
      const k = Math.min((sr.height - 14) / maxB, (sr.width + 40) / (maxR - Math.min(0, minL)), 1.45);
      if (Math.abs(k - 1) > 0.02) for (const e of sh) { e.style.width = parseFloat(e.style.width) * k + "px"; e.style.top = parseFloat(e.style.top) * k + "px"; e.style.left = parseFloat(e.style.left) * k + (sr.width * (1 - k)) / 2 + "px"; }
      const minT = Math.min(...sh.map((e) => e.getBoundingClientRect().top - sr.top));
      const maxB2 = Math.max(...sh.map((e) => e.getBoundingClientRect().bottom - sr.top));
      const dy = (sr.height - (maxB2 - minT)) / 2 - minT;
      if (dy > 4) for (const e of sh) e.style.top = parseFloat(e.style.top) + dy + "px";
      const bd = st.querySelector(".badge"); if (bd && dy > 4) bd.style.top = parseFloat(bd.style.top || 0) + dy + "px";
    });
    const bad = await p.evaluate(() => { const c = document.querySelector(".ctaRow").getBoundingClientRect(); return [...document.querySelectorAll(".sheet")].some((s) => s.getBoundingClientRect().bottom > c.top - 6) || document.querySelector(".wrap").scrollHeight > innerHeight + 2; });
    if (bad) console.warn(`  ! ${ad.id} ${fmt.tag}: folha encosta no botão ou conteúdo transborda`);
    await p.screenshot({ path: path.join(out, `TC${ad.id}-${fmt.tag}.png`) });
  }
  await p.close();
}
await browser.close();
console.log("ok:", ads.length * formats.length, "arquivos em", out);

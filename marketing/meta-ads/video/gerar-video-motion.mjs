// Vídeo do anúncio em estilo motion graphics (Reels/Stories 9:16), sincronizado com a narração e os efeitos.
// Uso: node gerar-video-motion.mjs <timeline.json> <cues.json> <voz.wav> <sfx.wav> <musica.wav> <saida.mp4>
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const [timelinePath, cuesPath, voicePath, sfxPath, musicPath, outPath] = process.argv.slice(2);
const TL = JSON.parse(readFileSync(timelinePath, "utf8"));
const CUES = JSON.parse(readFileSync(cuesPath, "utf8"));
const FPS = 30, W = 1080, H = 1920;
const frames = Math.ceil(TL.duration * FPS);
const tmp = "/tmp/video-motion-frames";
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: ${W}px; height: ${H}px; background: #050506; color: #fff; font-family: Inter, "Helvetica Neue", Arial, sans-serif; overflow: hidden; }
#stage { position: absolute; inset: 0; transform-origin: 50% 45%; }
#bg { position: absolute; inset: -10%; background: radial-gradient(60% 45% at 50% 42%, #1a0d04 0%, #0a0a0b 55%, #050506 100%); }
#floor { position: absolute; left: -50%; right: -50%; bottom: -10%; height: 70%; transform: perspective(700px) rotateX(62deg); transform-origin: 50% 100%;
  background-image: linear-gradient(rgba(255,107,0,.16) 2px, transparent 2px), linear-gradient(90deg, rgba(255,107,0,.16) 2px, transparent 2px); background-size: 90px 90px;
  -webkit-mask-image: linear-gradient(to top, #000 10%, transparent 85%); }
#rays { position: absolute; left: 50%; top: 42%; width: 2600px; height: 2600px; margin: -1300px 0 0 -1300px; border-radius: 50%; opacity: 0;
  background: repeating-conic-gradient(rgba(255,140,40,.22) 0deg 6deg, transparent 6deg 18deg); -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 60%); }
#glow { position: absolute; width: 1300px; height: 1300px; left: 50%; top: 42%; margin: -650px 0 0 -650px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,0,.35), transparent 60%); }
canvas { position: absolute; inset: 0; }
.brand { position: absolute; top: 290px; left: 0; right: 0; text-align: center; font-weight: 900; letter-spacing: .18em; font-size: 30px; text-transform: uppercase; }
.brand span { color: #ff6b00; }
.progress { position: absolute; top: 352px; left: 340px; right: 340px; height: 5px; background: rgba(255,255,255,.12); border-radius: 9px; overflow: hidden; }
.progress i { display: block; height: 100%; background: #ff6b00; width: 0; box-shadow: 0 0 12px #ff6b00; }
.scene { position: absolute; left: 60px; right: 60px; top: 420px; height: 830px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0; will-change: transform, filter, opacity; }
.k { font-weight: 900; letter-spacing: -.035em; line-height: 1.04; }
.w { display: inline-block; white-space: pre; opacity: 0; position: relative; }
.w.hl::before { content: ""; position: absolute; left: -10px; right: -10px; top: 12%; bottom: 6%; background: #ff6b00; border-radius: 12px; z-index: -1; transform-origin: left; transform: scaleX(var(--s, 0)); }
.w.hl { color: #0a0a0b; }
.w.or { color: #ff6b00; }
.caption { position: absolute; left: 70px; right: 70px; top: 1268px; display: flex; justify-content: center; text-align: center; opacity: 0; }
.caption p { font-size: 46px; font-weight: 800; line-height: 1.22; background: rgba(0,0,0,.6); padding: 14px 22px; border-radius: 18px; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.chip { display: flex; align-items: center; gap: 26px; font-size: 76px; font-weight: 900; margin: 20px 0; opacity: 0; }
.chip i { width: 112px; height: 112px; border-radius: 50%; border: 3px solid rgba(255,255,255,.35); background: rgba(255,255,255,.08); display: grid; place-items: center; font-style: normal; font-size: 40px; color: #ddd; }
.pin { position: absolute; transform: translate(-50%, -50%) scale(0); display: flex; flex-direction: column; align-items: center; gap: 10px; }
.pin b { width: 84px; height: 84px; border-radius: 50%; background: #ff6b00; color: #0a0a0b; display: grid; place-items: center; font-size: 38px; font-weight: 900; box-shadow: 0 0 0 10px rgba(255,107,0,.25), 0 0 40px rgba(255,107,0,.8); }
.pin span { font-size: 30px; font-weight: 800; background: rgba(0,0,0,.65); padding: 6px 14px; border-radius: 10px; }
.phone { width: 560px; height: 800px; border-radius: 56px; border: 10px solid #2a2a2e; background: #0f0f11; padding: 54px 36px; text-align: left; box-shadow: 0 60px 120px -30px rgba(0,0,0,.95), 0 0 80px -20px rgba(255,107,0,.5); position: relative; overflow: hidden; }
.phone .bar { height: 8px; border-radius: 9px; background: rgba(255,255,255,.1); overflow: hidden; margin-bottom: 40px; }
.phone .bar i { display: block; height: 100%; background: #ff6b00; box-shadow: 0 0 10px #ff6b00; }
.phone h2 { font-size: 44px; font-weight: 900; line-height: 1.12; margin-bottom: 34px; letter-spacing: -.02em; min-height: 150px; }
.opt { font-size: 32px; font-weight: 700; padding: 26px 24px; border-radius: 20px; background: #1a1a1d; border: 3px solid transparent; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
.opt.on { border-color: #ff6b00; background: #2a1708; box-shadow: 0 0 30px -6px rgba(255,107,0,.8); }
.opt.on::after { content: "✓"; color: #ff6b00; font-weight: 900; }
.ripple { position: absolute; border-radius: 50%; border: 4px solid #fff; pointer-events: none; opacity: 0; }
.book { position: relative; width: 380px; aspect-ratio: 3/4; transform-style: preserve-3d; }
.book .cover { position: absolute; inset: 0; background: #0d0d0f; border: 1px solid rgba(255,255,255,.14); border-radius: 4px 12px 12px 4px; overflow: hidden; box-shadow: inset 8px 0 14px -8px rgba(255,255,255,.35), 30px 50px 90px -20px rgba(0,0,0,.95), 0 0 120px -30px rgba(255,107,0,.7); display: flex; flex-direction: column; justify-content: space-between; padding: 9%; text-align: left; }
.book .pages { position: absolute; top: 2%; bottom: 2%; right: -4%; width: 7%; background: repeating-linear-gradient(90deg,#e8e8e8 0 2px,#cfcfcf 2px 3px); transform: rotateY(60deg); transform-origin: left; }
.book svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.book .shine { position: absolute; top: -20%; bottom: -20%; width: 40%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.55), transparent); transform: skewX(-15deg); left: -60%; }
.badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 56px; max-width: 900px; }
.badge { font-size: 32px; font-weight: 800; padding: 16px 24px; border-radius: 999px; border: 2px solid rgba(255,107,0,.7); background: rgba(255,107,0,.16); opacity: 0; box-shadow: 0 0 30px -10px rgba(255,107,0,.9); }
.cta { display: inline-flex; align-items: center; gap: 18px; background: #ff6b00; color: #0a0a0b; font-weight: 900; text-transform: uppercase; font-size: 54px; padding: 40px 56px; border-radius: 26px; box-shadow: 0 30px 70px -20px rgba(255,107,0,.95); position: relative; }
.ring { position: absolute; inset: -4px; border-radius: 30px; border: 4px solid #ff6b00; opacity: 0; }
.arrow { font-size: 130px; color: #ff6b00; font-weight: 900; margin-top: 46px; text-shadow: 0 0 30px rgba(255,107,0,.8); }
#flash { position: absolute; inset: 0; background: #fff; opacity: 0; pointer-events: none; }
#vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(75% 60% at 50% 45%, transparent 55%, rgba(0,0,0,.75) 100%); }
.legal { position: absolute; bottom: 360px; left: 0; right: 0; text-align: center; font-size: 22px; color: #77777f; opacity: 0; }
</style></head><body>
<div id="stage">
  <div id="bg"></div><div id="rays"></div><div id="glow"></div><div id="floor"></div>
  <canvas id="fx" width="${W}" height="${H}"></canvas>
  <div class="brand">Rota <span>Invisível</span></div>
  <div class="progress"><i id="prog"></i></div>

  <div class="scene" data-id="hook"><div class="k" style="font-size:108px" data-words="Você|não|precisa|de|*mais|*dinheiro|para|começar."></div></div>

  <div class="scene" data-id="rota">
    <svg width="940" height="720" viewBox="0 0 940 720" style="overflow:visible;filter:drop-shadow(0 0 14px rgba(255,107,0,.85))">
      <path id="routePath" d="M40 660 C 200 620, 230 450, 390 440 S 620 490, 660 310 S 780 100, 900 60" fill="none" stroke="#ff6b00" stroke-width="12" stroke-linecap="round" stroke-dasharray="28 22"/>
      <circle id="routeDot" r="24" fill="#fff"/><circle id="routeHalo" r="52" fill="none" stroke="#ff6b00" stroke-opacity=".5" stroke-width="6"/>
    </svg>
    <div class="pin" data-k="0"><b>✦</b><span>Serviços</span></div>
    <div class="pin" data-k="1"><b>R$</b><span>Vendas</span></div>
    <div class="pin" data-k="2"><b>▶</b><span>Conteúdo</span></div>
  </div>

  <div class="scene" data-id="objecao" style="align-items:flex-start;padding-left:50px">
    <svg width="900" height="300" viewBox="0 0 900 300" style="position:absolute;right:-20px;bottom:-30px;opacity:.55">
      <path id="downLine" d="M0 40 L 150 70 L 280 60 L 420 140 L 560 130 L 700 220 L 880 270" fill="none" stroke="#9a9aa3" stroke-width="8" stroke-linejoin="round"/>
    </svg>
    <div class="chip" data-k="0"><i>1h</i>Pouco tempo?</div>
    <div class="chip" data-k="1"><i>R$</i>Pouco dinheiro?</div>
    <div class="chip" data-k="2"><i>?</i>Sem experiência?</div>
  </div>

  <div class="scene" data-id="virada">
    <svg width="900" height="420" viewBox="0 0 900 420" style="position:absolute;left:30px;bottom:-40px;filter:drop-shadow(0 0 18px rgba(255,107,0,.9))">
      <path id="upLine" d="M0 380 L 150 330 L 290 345 L 430 250 L 570 265 L 720 140 L 880 40" fill="none" stroke="#ff6b00" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
      <polygon id="upArrow" points="880,40 845,48 868,74" fill="#ff6b00"/>
    </svg>
    <div class="k" style="font-size:112px;position:relative" data-words="Ainda|assim,|existem|caminhos|~para|~você."></div>
  </div>

  <div class="scene" data-id="quiz">
    <div class="phone" id="phone">
      <div class="bar"><i id="qbar"></i></div>
      <h2 id="qtitle"></h2>
      <div id="qopts"></div>
      <div class="ripple" id="rip1"></div><div class="ripple" id="rip2"></div>
    </div>
  </div>

  <div class="scene" data-id="produto">
    <svg width="980" height="520" viewBox="0 0 980 520" style="position:absolute;top:40px;opacity:.5">
      ${[0,1,2,3,4,5,6].map((i) => `<rect class="barc" data-i="${i}" x="${30 + i * 135}" width="90" y="520" height="0" rx="12" fill="#ff6b00"/>`).join("")}
    </svg>
    <div class="book" id="book"><div class="pages"></div><div class="cover">
      <svg viewBox="0 0 100 133" preserveAspectRatio="none"><path d="M-5 120 C 20 110, 25 80, 45 78 S 70 60, 72 40 S 90 18, 110 12" fill="none" stroke="#ff6b00" stroke-width=".9" stroke-dasharray="2.4 2.4"/><circle cx="72" cy="40" r="2" fill="#ff6b00"/></svg>
      <div style="position:relative;width:30%;height:5px;background:#ff6b00"></div>
      <div style="position:relative"><div style="color:#ff6b00;font-size:18px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px">Guia prático</div><div style="font-weight:900;text-transform:uppercase;line-height:.95;font-size:56px">Rota Invisível</div></div>
      <div class="shine" id="shine"></div>
    </div></div>
    <div class="badges">
      <span class="badge" data-k="0">✓ 30 ideias</span><span class="badge" data-k="1">✓ Ferramentas gratuitas</span>
      <span class="badge" data-k="2">✓ Scripts para clientes</span><span class="badge" data-k="3">✓ Plano de 30 dias</span>
    </div>
  </div>

  <div class="scene" data-id="cta">
    <div class="k" style="font-size:80px;margin-bottom:56px" data-words="Descubra|seu|caminho|~em|~2|~minutos."></div>
    <div class="cta" id="ctaBtn">Faça o quiz gratuito<div class="ring" id="ring1"></div><div class="ring" id="ring2"></div></div>
    <div class="arrow" id="arrow">↓</div>
  </div>

  <div class="caption"><p id="cap"></p></div>
  <div class="legal" id="legal">Produto educativo · resultados não são garantidos</div>
</div>
<div id="flash"></div><div id="vignette"></div>

<script>
const TL = ${JSON.stringify(TL)};
const CUES = ${JSON.stringify(CUES)};
const CAP = ["rota", "quiz", "produto"];
const S = Object.fromEntries(TL.scenes.map((s) => [s.id, s]));
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const back = (x) => { x = clamp(x); const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// palavras do texto cinético: * = destaque com caixa laranja, ~ = texto laranja
document.querySelectorAll("[data-words]").forEach((el) => {
  el.innerHTML = el.dataset.words.split("|").map((w) => {
    const cls = w[0] === "*" ? "w hl" : w[0] === "~" ? "w or" : "w";
    return '<span class="' + cls + '">' + w.replace(/^[*~]/, "") + "</span>";
  }).join(" ");
});

const Q = [
  { t: "Quanto tempo por dia você teria disponível?", o: ["Até 1 hora por dia", "De 1 a 3 horas", "Mais de 3 horas"], pick: 0 },
  { t: "Quanto você poderia investir para começar?", o: ["Até R$ 50", "De R$ 50 a R$ 300", "Mais de R$ 300"], pick: 0 },
  { t: "O que você prefere fazer?", o: ["Vender produtos", "Prestar serviços", "Criar conteúdo"], pick: 1 },
];
const route = document.getElementById("routePath"), RL = route.getTotalLength();
const down = document.getElementById("downLine"), DL = down.getTotalLength();
const up = document.getElementById("upLine"), UL = up.getTotalLength();
const fx = document.getElementById("fx").getContext("2d");

// moedas: cada evento gera moedas determinísticas com física simples
const COINS = [];
CUES.filter((c) => c.kind === "coins").forEach((c, ci) => {
  for (let j = 0; j < c.n; j++) {
    const r = (k) => hash(ci * 1000 + j * 13 + k);
    if (c.mode === "burst") COINS.push({ t0: c.t + r(1) * 0.12, x: 540 + (r(2) - .5) * 120, y: 860, vx: (r(3) - .5) * 1500, vy: -900 - r(4) * 1100, g: 2600, s: 34 + r(5) * 22, spin: 6 + r(6) * 10 });
    else COINS.push({ t0: c.t + r(1) * 2.2, x: 60 + r(2) * 960, y: -80, vx: (r(3) - .5) * 120, vy: 300 + r(4) * 500, g: 1400, s: 30 + r(5) * 26, spin: 4 + r(6) * 8 });
  }
});
function drawCoin(x, y, s, a, rot) {
  const sx = Math.abs(Math.cos(rot)) * 0.85 + 0.15;
  fx.save(); fx.translate(x, y); fx.scale(sx, 1); fx.globalAlpha = a;
  const g = fx.createRadialGradient(-s * .3, -s * .3, s * .1, 0, 0, s);
  g.addColorStop(0, "#ffe6a3"); g.addColorStop(.55, "#ffb020"); g.addColorStop(1, "#c46a00");
  fx.fillStyle = g; fx.beginPath(); fx.arc(0, 0, s, 0, Math.PI * 2); fx.fill();
  fx.strokeStyle = "rgba(120,60,0,.65)"; fx.lineWidth = s * .12; fx.beginPath(); fx.arc(0, 0, s * .72, 0, Math.PI * 2); fx.stroke();
  if (sx > .45) { fx.fillStyle = "rgba(110,55,0,.85)"; fx.font = "900 " + s * .8 + "px Arial"; fx.textAlign = "center"; fx.textBaseline = "middle"; fx.fillText("$", 0, s * .05); }
  fx.restore();
}

const lastCue = (kind, t, win) => CUES.filter((c) => c.kind === kind && c.t <= t && t - c.t < win).pop();
const nextScene = (i) => TL.scenes[i + 1];

window.draw = (t) => {
  // ---- câmera: zoom lento contínuo + tremida nos impactos
  let shake = 0;
  CUES.filter((c) => (c.kind === "impact" || c.kind === "thud") && t >= c.t && t - c.t < .45).forEach((c) => { shake += (c.kind === "thud" ? 14 : c.soft ? 10 : 26) * Math.exp(-(t - c.t) * 9); });
  const sx = shake * (hash(Math.floor(t * 60)) - .5) * 2, sy = shake * (hash(Math.floor(t * 60) + 7) - .5) * 2;
  document.getElementById("stage").style.transform = "translate(" + sx + "px," + sy + "px) scale(" + (1.02 + .025 * Math.sin(t * .6)) + ") rotate(" + (.35 * Math.sin(t * .4)) + "deg)";

  // ---- humor: cinza nas objeções, cor e luz depois da virada
  const o = S.objecao, v = S.virada;
  const gray = clamp((t - (o.start - .3)) / .4) * (1 - clamp((t - v.start) / .15));
  document.getElementById("stage").style.filter = "grayscale(" + gray + ") brightness(" + (1 - .35 * gray) + ") contrast(" + (1 + .1 * gray) + ")";
  const prosper = clamp((t - v.start) / .3);
  document.getElementById("rays").style.opacity = prosper * (.55 + .2 * Math.sin(t * 2));
  document.getElementById("rays").style.transform = "rotate(" + t * 8 + "deg)";
  document.getElementById("glow").style.opacity = .5 + .35 * prosper + .1 * Math.sin(t * 1.7);
  document.getElementById("floor").style.backgroundPosition = "0 " + (t * 140) + "px";
  const fl = lastCue("flash", t, .5);
  document.getElementById("flash").style.opacity = fl ? Math.exp(-(t - fl.t) * 7) * .9 : 0;
  document.getElementById("prog").style.width = (100 * t / TL.duration) + "%";

  // ---- canvas: partículas + moedas
  fx.clearRect(0, 0, ${W}, ${H});
  for (let i = 0; i < 70; i++) {
    const sp = 40 + hash(i) * 90, px = (hash(i + 50) * ${W} + Math.sin(t * .7 + i) * 30), py = ((hash(i + 99) * ${H} - t * sp) % ${H} + ${H}) % ${H};
    const a = (.25 + .5 * hash(i + 3)) * (.6 + .4 * Math.sin(t * 3 + i)) * (1 - gray * .7);
    fx.fillStyle = "rgba(255," + Math.floor(120 + 60 * hash(i + 8)) + ",30," + a + ")";
    fx.beginPath(); fx.arc(px, py, 2 + hash(i + 4) * 4, 0, Math.PI * 2); fx.fill();
  }
  COINS.forEach((c) => {
    const d = t - c.t0; if (d < 0 || d > 3.2) return;
    const x = c.x + c.vx * d, y = c.y + c.vy * d + .5 * c.g * d * d;
    if (y > ${H} + 80) return;
    drawCoin(x, y, c.s, clamp(d / .05) * clamp((3.2 - d) / .4), c.spin * d);
  });

  // ---- cenas
  let capText = "", capA = 0;
  TL.scenes.forEach((s, i) => {
    const el = document.querySelector('.scene[data-id="' + s.id + '"]');
    const nx = nextScene(i);
    const inP = clamp((t - (s.start - .28)) / .38), outP = nx ? clamp((t - (nx.start - .26)) / .3) : 0;
    const a = ease(inP) * (1 - ease(outP));
    el.style.opacity = a;
    // transição: entra de um zoom com desfoque, sai encolhendo com desfoque
    const sc = (1 + .18 * (1 - ease(inP))) * (1 - .12 * ease(outP));
    el.style.transform = "scale(" + sc + ") translateY(" + (-60 * ease(outP)) + "px)";
    el.style.filter = "blur(" + (14 * (1 - ease(inP)) + 16 * ease(outP)) + "px)";
    if (a <= 0) return;
    const p = clamp((t - s.start) / (s.end - s.start));
    if (CAP.includes(s.id)) { capText = s.legenda; capA = a; }

    // texto cinético: palavras entram em sequência com salto e desfoque
    const ws = el.querySelectorAll(".w");
    ws.forEach((w, k) => {
      const at = s.start - .1 + k * Math.min(.22, (s.end - s.start) * .75 / ws.length);
      const wp = clamp((t - at) / .32);
      w.style.opacity = clamp(wp * 2);
      w.style.transform = "translateY(" + (50 * (1 - ease(wp))) + "px) scale(" + (.6 + .4 * back(wp)) + ")";
      w.style.filter = "blur(" + 8 * (1 - ease(wp)) + "px)";
      if (w.classList.contains("hl")) w.style.setProperty("--s", ease((t - at - .15) / .3));
      if (w.classList.contains("or")) w.style.textShadow = "0 0 " + (20 + 14 * Math.sin(t * 5)) + "px rgba(255,107,0,.7)";
    });

    if (s.id === "rota") {
      const dr = ease(p * 1.15);
      route.style.clipPath = "inset(0 " + (100 - dr * 100) + "% 0 0)";
      const pt = route.getPointAtLength(RL * dr);
      ["routeDot", "routeHalo"].forEach((id) => { const c = document.getElementById(id); c.setAttribute("cx", pt.x); c.setAttribute("cy", pt.y); });
      document.getElementById("routeHalo").setAttribute("r", 44 + 14 * Math.sin(t * 8));
      el.querySelectorAll(".pin").forEach((pin) => {
        const k = +pin.dataset.k, cue = CUES.filter((c) => c.kind === "pop")[k];
        const pp = route.getPointAtLength(RL * [.3, .6, .92][k]);
        pin.style.left = (pp.x / 940 * 100) + "%"; pin.style.top = (pp.y + 60) + "px";
        const q = clamp((t - cue.t + .05) / .35);
        pin.style.transform = "translate(-50%,-50%) scale(" + back(q) + ")";
      });
    }
    if (s.id === "objecao") {
      down.style.strokeDasharray = DL; down.style.strokeDashoffset = DL * (1 - ease(p * 1.3));
      el.querySelectorAll(".chip").forEach((c) => {
        const k = +c.dataset.k, q = clamp((t - s.marks[k] + .08) / .25);
        c.style.opacity = clamp(q * 3);
        c.style.transform = "translateX(" + (-220 * (1 - ease(q))) + "px) scale(" + (1.35 - .35 * back(q)) + ")";
      });
    }
    if (s.id === "virada") {
      up.style.strokeDasharray = UL; up.style.strokeDashoffset = UL * (1 - ease((t - s.start) / 1.4));
      document.getElementById("upArrow").style.opacity = clamp((t - s.start - 1.2) / .2);
    }
    if (s.id === "quiz") {
      const ph = document.getElementById("phone"), e = ease((t - s.start + .2) / .6);
      ph.style.transform = "perspective(1400px) translateY(" + (380 * (1 - e)) + "px) rotateX(" + (35 * (1 - e)) + "deg) rotateY(" + (6 * Math.sin(t * .9)) + "deg)";
      const taps = CUES.filter((c) => c.kind === "tap");
      let seg = 0; taps.forEach((c, k) => { if (t >= c.t + .45) seg = Math.min(2, k + 1); });
      const q = Q[seg], tap = taps[seg], picked = t >= tap.t;
      document.getElementById("qtitle").textContent = q.t;
      document.getElementById("qbar").style.width = ((seg + (picked ? 1 : 0)) / 7 * 100 + 14) + "%";
      document.getElementById("qopts").innerHTML = q.o.map((x, k) => '<div class="opt' + (picked && k === q.pick ? " on" : "") + '">' + x + "</div>").join("");
      ["rip1", "rip2"].forEach((id, j) => {
        const r = document.getElementById(id), d = t - tap.t - j * .12;
        const sz = 40 + 380 * ease(d / .6);
        r.style.opacity = d >= 0 && d < .6 ? (1 - d / .6) * .8 : 0;
        r.style.width = r.style.height = sz + "px";
        r.style.left = (240 - sz / 2) + "px"; r.style.top = (330 + q.pick * 112 - sz / 2) + "px";
      });
    }
    if (s.id === "produto") {
      const e = ease((t - s.start + .2) / .9);
      document.getElementById("book").style.transform = "perspective(1400px) translateY(" + (120 * (1 - e)) + "px) scale(" + (.6 + .4 * back((t - s.start + .2) / .9)) + ") rotateY(" + (-200 * (1 - e) - 24 + 10 * Math.sin(p * Math.PI)) + "deg) rotateX(4deg)";
      const sh = CUES.find((c) => c.kind === "shine");
      document.getElementById("shine").style.left = (-60 + 220 * clamp((t - sh.t) / .7)) + "%";
      el.querySelectorAll(".barc").forEach((b) => {
        const i = +b.dataset.i, h = (90 + i * 60) * ease((t - s.start - i * .12) / .6);
        b.setAttribute("y", 520 - h); b.setAttribute("height", h);
      });
      const dings = CUES.filter((c) => c.kind === "ding");
      el.querySelectorAll(".badge").forEach((b) => {
        const k = +b.dataset.k, q = clamp((t - dings[k].t + .05) / .3);
        b.style.opacity = clamp(q * 3); b.style.transform = "scale(" + back(q) + ") translateY(" + (30 * (1 - ease(q))) + "px)";
      });
    }
    if (s.id === "cta") {
      const b = document.getElementById("ctaBtn"), q = clamp((t - s.start - .5) / .45);
      b.style.transform = "scale(" + (back(q) * (1 + .045 * Math.sin(t * 6))) + ")";
      ["ring1", "ring2"].forEach((id, j) => {
        const d = ((t - s.start - .8 - j * .6) % 1.2 + 1.2) % 1.2, r = document.getElementById(id);
        r.style.opacity = t > s.start + .8 ? (1 - d / 1.2) * .9 : 0; r.style.transform = "scale(" + (1 + .35 * d) + ")";
      });
      document.getElementById("arrow").style.transform = "translateY(" + 22 * Math.abs(Math.sin(t * 4.5)) + "px)";
      document.getElementById("arrow").style.opacity = clamp((t - s.start - .9) / .3);
      document.getElementById("legal").style.opacity = a;
    }
  });
  document.getElementById("cap").textContent = capText;
  document.querySelector(".caption").style.opacity = capA;
};
</script></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.setContent(html);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// PREVIEW="1.6,7.5" → gera só esses instantes em /tmp/prev-<t>.png (para revisão rápida)
if (process.env.PREVIEW) {
  for (const t of process.env.PREVIEW.split(",").map(Number)) {
    await page.evaluate((x) => window.draw(x), t);
    await page.screenshot({ path: `/tmp/prev-${t}.png` });
  }
  console.log("prévia ok", errors.length ? errors : "");
  await browser.close();
  process.exit(0);
}
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.draw(t), f / FPS);
  await page.screenshot({ path: path.join(tmp, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 });
  if (f % 150 === 0) console.log(`quadro ${f}/${frames}`);
}
await browser.close();

// mixagem: voz em primeiro plano, efeitos por cima, trilha abaixando automaticamente quando a voz fala
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-framerate", String(FPS), "-i", path.join(tmp, "%05d.jpg"),
  "-i", voicePath, "-i", sfxPath, "-i", musicPath,
  "-filter_complex",
  [
    // cada camada é normalizada a um nível-alvo: voz em primeiro plano, efeitos para ênfase, trilha no fundo
    "[1:a]aresample=48000,aformat=channel_layouts=stereo,loudnorm=I=-16:TP=-2:LRA=11,asplit=2[v][vkey]",
    "[2:a]aresample=48000,loudnorm=I=-24:TP=-3:LRA=20[fx]",
    "[3:a]aresample=48000,loudnorm=I=-30:TP=-6:LRA=11[mus]",
    "[mus][vkey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[duck]",
    "[v][fx][duck]amix=inputs=3:normalize=0:duration=first,loudnorm=I=-15:TP=-1.5:LRA=11[a]",
  ].join(";"),
  "-map", "0:v", "-map", "[a]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", outPath,
]);
rmSync(tmp, { recursive: true, force: true });
console.log("Vídeo:", outPath);

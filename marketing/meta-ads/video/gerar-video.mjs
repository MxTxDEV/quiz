// Gera o vídeo do anúncio (Reels/Stories 9:16) a partir da linha do tempo da narração.
// Uso: node marketing/meta-ads/video/gerar-video.mjs <timeline.json> <narracao.wav> <saida.mp4>
// Renderiza quadro a quadro (30 fps) com Playwright e monta com ffmpeg.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const [timelinePath, audioPath, outPath] = process.argv.slice(2);
const timeline = JSON.parse(readFileSync(timelinePath, "utf8"));
const FPS = 30;
const W = 1080, H = 1920;
const frames = Math.ceil(timeline.duration * FPS);
const tmp = "/tmp/video-frames";
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });

// legendas só nas cenas em que o visual não repete o texto
const CAPTION = new Set(["rota", "quiz", "produto"]);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: ${W}px; height: ${H}px; background: #0a0a0b; color: #fff; font-family: Inter, "Helvetica Neue", Arial, sans-serif; overflow: hidden; position: relative; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px); background-size: 60px 60px; }
.glow { position: absolute; width: 1100px; height: 1100px; border-radius: 50%; background: radial-gradient(circle, rgba(255,107,0,.26), transparent 62%); left: 50%; top: 50%; }
.brand { position: absolute; top: 290px; left: 0; right: 0; text-align: center; font-weight: 900; letter-spacing: .18em; font-size: 30px; text-transform: uppercase; }
.brand span { color: #ff6b00; }
.progress { position: absolute; top: 352px; left: 340px; right: 340px; height: 5px; background: rgba(255,255,255,.12); border-radius: 9px; overflow: hidden; }
.progress i { display: block; height: 100%; background: #ff6b00; width: 0; }
.scene { position: absolute; left: 70px; right: 70px; top: 420px; height: 820px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; opacity: 0; }
h1 { font-weight: 900; letter-spacing: -.035em; line-height: 1.02; }
.o { color: #ff6b00; }
.caption { position: absolute; left: 70px; right: 70px; top: 1268px; min-height: 200px; display: flex; align-items: flex-start; justify-content: center; text-align: center; opacity: 0; }
.caption p { font-size: 46px; font-weight: 800; line-height: 1.22; background: rgba(0,0,0,.55); padding: 14px 22px; border-radius: 18px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.chip { display: flex; align-items: center; gap: 26px; font-size: 76px; font-weight: 900; margin: 22px 0; opacity: 0; }
.chip i { width: 110px; height: 110px; border-radius: 50%; border: 3px solid rgba(255,107,0,.7); background: rgba(255,107,0,.18); display: grid; place-items: center; color: #ff6b00; font-style: normal; font-size: 40px; }
.phone { width: 560px; height: 800px; border-radius: 56px; border: 10px solid #26262a; background: #0f0f11; padding: 54px 36px; text-align: left; box-shadow: 0 40px 100px -30px rgba(0,0,0,.9); position: relative; }
.phone .bar { height: 8px; border-radius: 9px; background: rgba(255,255,255,.1); overflow: hidden; margin-bottom: 40px; }
.phone .bar i { display: block; height: 100%; background: #ff6b00; }
.phone h2 { font-size: 44px; font-weight: 900; line-height: 1.12; margin-bottom: 34px; letter-spacing: -.02em; min-height: 150px; }
.opt { font-size: 32px; font-weight: 700; padding: 26px 24px; border-radius: 20px; background: #1a1a1d; border: 3px solid transparent; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center; }
.opt.on { border-color: #ff6b00; background: #2a1708; }
.opt.on::after { content: "✓"; color: #ff6b00; font-weight: 900; }
.tap { position: absolute; width: 90px; height: 90px; border-radius: 50%; background: rgba(255,255,255,.35); border: 3px solid #fff; opacity: 0; pointer-events: none; }
.book { position: relative; width: 360px; aspect-ratio: 3/4; transform-style: preserve-3d; }
.book .cover { position: absolute; inset: 0; background: #0d0d0f; border: 1px solid rgba(255,255,255,.12); border-radius: 4px 12px 12px 4px; overflow: hidden; box-shadow: inset 8px 0 14px -8px rgba(255,255,255,.35), 30px 50px 90px -20px rgba(0,0,0,.95); display: flex; flex-direction: column; justify-content: space-between; padding: 9%; text-align: left; }
.book .pages { position: absolute; top: 2%; bottom: 2%; right: -4%; width: 7%; background: repeating-linear-gradient(90deg,#e8e8e8 0 2px,#cfcfcf 2px 3px); transform: rotateY(60deg); transform-origin: left; }
.book svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.badges { display: flex; flex-wrap: wrap; justify-content: center; gap: 16px; margin-top: 56px; }
.badge { font-size: 32px; font-weight: 800; padding: 16px 24px; border-radius: 999px; border: 2px solid rgba(255,107,0,.55); color: #fff; background: rgba(255,107,0,.12); opacity: 0; }
.cta { display: inline-flex; align-items: center; gap: 18px; background: #ff6b00; color: #0a0a0b; font-weight: 900; text-transform: uppercase; font-size: 54px; padding: 40px 56px; border-radius: 26px; box-shadow: 0 30px 70px -20px rgba(255,107,0,.9); }
.arrow { font-size: 120px; color: #ff6b00; font-weight: 900; margin-top: 50px; }
.url { margin-top: 30px; font-size: 34px; color: #b4b4bc; font-weight: 700; letter-spacing: .02em; }
.legal { position: absolute; bottom: 360px; left: 0; right: 0; text-align: center; font-size: 22px; color: #77777f; opacity: 0; }
</style></head><body>
<div class="grid"></div><div class="glow" id="glow"></div>
<div class="brand">Rota <span>Invisível</span></div>
<div class="progress"><i id="prog"></i></div>

<div class="scene" data-id="hook"><h1 style="font-size:104px" id="hookText">Você não precisa de <span class="o">mais dinheiro</span> para começar.</h1></div>

<div class="scene" data-id="rota">
  <svg width="900" height="700" viewBox="0 0 900 700" style="overflow:visible">
    <path id="routePath" d="M40 640 C 200 600, 220 430, 380 420 S 600 470, 640 300 S 760 90, 880 60" fill="none" stroke="#ff6b00" stroke-width="10" stroke-linecap="round" stroke-dasharray="26 22"/>
    <circle id="routeDot" r="22" fill="#ff6b00"/><circle id="routeHalo" r="46" fill="none" stroke="#ff6b00" stroke-opacity=".35" stroke-width="6"/>
  </svg>
</div>

<div class="scene" data-id="objecao" style="align-items:flex-start;padding-left:60px">
  <div class="chip" data-k="0"><i>1h</i>Pouco tempo?</div>
  <div class="chip" data-k="1"><i>R$</i>Pouco dinheiro?</div>
  <div class="chip" data-k="2"><i>?</i>Sem experiência?</div>
</div>

<div class="scene" data-id="virada"><h1 style="font-size:110px">Ainda assim, existem caminhos <span class="o">para você.</span></h1></div>

<div class="scene" data-id="quiz">
  <div class="phone">
    <div class="bar"><i id="qbar"></i></div>
    <h2 id="qtitle"></h2>
    <div id="qopts"></div>
    <div class="tap" id="tap"></div>
  </div>
</div>

<div class="scene" data-id="produto">
  <div class="book" id="book"><div class="pages"></div><div class="cover">
    <svg viewBox="0 0 100 133" preserveAspectRatio="none"><path d="M-5 120 C 20 110, 25 80, 45 78 S 70 60, 72 40 S 90 18, 110 12" fill="none" stroke="#ff6b00" stroke-width=".9" stroke-dasharray="2.4 2.4"/><circle cx="72" cy="40" r="2" fill="#ff6b00"/></svg>
    <div style="position:relative;width:30%;height:5px;background:#ff6b00"></div>
    <div style="position:relative"><div style="color:#ff6b00;font-size:18px;font-weight:800;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px">Guia prático</div><div style="font-weight:900;text-transform:uppercase;line-height:.95;font-size:52px">Rota Invisível</div></div>
  </div></div>
  <div class="badges">
    <span class="badge" data-k="0">✓ 30 ideias</span><span class="badge" data-k="1">✓ Ferramentas gratuitas</span>
    <span class="badge" data-k="2">✓ Scripts para clientes</span><span class="badge" data-k="3">✓ Plano de 30 dias</span>
  </div>
</div>

<div class="scene" data-id="cta">
  <h1 style="font-size:78px;margin-bottom:56px">Descubra seu caminho <span class="o">em 2 minutos.</span></h1>
  <div class="cta" id="ctaBtn">Faça o quiz gratuito</div>
  <div class="arrow" id="arrow">↓</div>
</div>

<div class="caption"><p id="cap"></p></div>
<div class="legal" id="legal">Produto educativo · resultados não são garantidos</div>

<script>
const TL = ${JSON.stringify(timeline)};
const CAP = ${JSON.stringify([...CAPTION])};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const Q = [
  { t: "Quanto tempo por dia você teria disponível?", o: ["Até 1 hora por dia", "De 1 a 3 horas", "Mais de 3 horas"], pick: 0 },
  { t: "Quanto você poderia investir para começar?", o: ["Até R$ 50", "De R$ 50 a R$ 300", "Mais de R$ 300"], pick: 0 },
  { t: "O que você prefere fazer?", o: ["Vender produtos", "Prestar serviços", "Criar conteúdo"], pick: 1 },
];
const path = document.getElementById("routePath");
const L = path.getTotalLength();

function sceneAlpha(s, i, t) {
  const next = TL.scenes[i + 1];
  const inA = ease((t - (s.start - 0.25)) / 0.35);
  const outStart = next ? next.start - 0.25 : TL.duration + 1;
  const outA = 1 - ease((t - outStart) / 0.3);
  return clamp(Math.min(inA, outA));
}

window.draw = (t) => {
  document.getElementById("prog").style.width = (100 * t / TL.duration) + "%";
  const g = document.getElementById("glow");
  g.style.transform = "translate(" + (-50 + 12 * Math.sin(t / 3)) + "%," + (-50 + 10 * Math.cos(t / 4)) + "%)";
  let capText = "", capA = 0;
  TL.scenes.forEach((s, i) => {
    const el = document.querySelector('.scene[data-id="' + s.id + '"]');
    const a = sceneAlpha(s, i, t);
    const p = clamp((t - s.start) / (s.end - s.start));
    el.style.opacity = a;
    el.style.transform = "translateY(" + (1 - ease((t - s.start + 0.25) / 0.5)) * 40 + "px)";
    if (a > 0 && CAP.includes(s.id)) { capText = s.legenda; capA = a; }

    if (s.id === "hook") document.getElementById("hookText").style.transform = "scale(" + (0.94 + 0.06 * ease(p * 2)) + ")";
    if (s.id === "rota") {
      // o caminho tracejado é revelado da esquerda para a direita e o ponto percorre a rota
      const drawn = ease(p * 1.2);
      path.style.clipPath = "inset(0 " + (100 - drawn * 100) + "% 0 0)";
      const pt = path.getPointAtLength(L * drawn);
      for (const id of ["routeDot", "routeHalo"]) {
        document.getElementById(id).setAttribute("cx", pt.x);
        document.getElementById(id).setAttribute("cy", pt.y);
      }
      document.getElementById("routeHalo").setAttribute("r", 40 + 10 * Math.sin(t * 6));
    }
    if (s.id === "objecao") document.querySelectorAll(".chip").forEach((c) => {
      const k = +c.dataset.k;
      // com marcas de tempo da narração, cada item entra exatamente quando é falado
      const ap = s.marks ? ease((t - s.marks[k] + 0.1) / 0.3) : ease((p - k * 0.27) / 0.18);
      c.style.opacity = ap; c.style.transform = "translateX(" + (1 - ap) * -60 + "px)";
    });
    if (s.id === "virada") el.querySelector("h1").style.transform = "scale(" + (0.96 + 0.04 * ease(p * 2)) + ")";
    if (s.id === "quiz") {
      const seg = Math.min(2, Math.floor(p * 3)); const lp = p * 3 - seg; const q = Q[seg];
      document.getElementById("qtitle").textContent = q.t;
      document.getElementById("qbar").style.width = ((seg + (lp > 0.6 ? 1 : 0)) / 7 * 100 + 14) + "%";
      const picked = lp > 0.6;
      document.getElementById("qopts").innerHTML = q.o.map((o, k) => '<div class="opt' + (picked && k === q.pick ? " on" : "") + '">' + o + "</div>").join("");
      const tap = document.getElementById("tap");
      const tp = clamp((lp - 0.45) / 0.25);
      tap.style.opacity = tp > 0 && tp < 1 ? Math.sin(tp * Math.PI) : 0;
      tap.style.left = "330px"; tap.style.top = (302 + q.pick * 110) + "px";
      tap.style.transform = "scale(" + (0.6 + 0.6 * tp) + ")";
    }
    if (s.id === "produto") {
      document.getElementById("book").style.transform = "perspective(1400px) rotateY(" + (-26 + 10 * Math.sin(p * Math.PI)) + "deg) rotateX(4deg)";
      document.querySelectorAll(".badge").forEach((b) => { const k = +b.dataset.k; const ap = ease((p - 0.25 - k * 0.14) / 0.12); b.style.opacity = ap; b.style.transform = "translateY(" + (1 - ap) * 20 + "px)"; });
    }
    if (s.id === "cta") {
      document.getElementById("ctaBtn").style.transform = "scale(" + (1 + 0.04 * Math.sin(t * 5)) + ")";
      document.getElementById("arrow").style.transform = "translateY(" + 18 * Math.abs(Math.sin(t * 4)) + "px)";
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
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.draw(t), f / FPS);
  await page.screenshot({ path: path.join(tmp, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 90 });
  if (f % 150 === 0) console.log(`quadro ${f}/${frames}`);
}
await browser.close();

execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-framerate", String(FPS), "-i", path.join(tmp, "%05d.jpg"),
  "-i", audioPath,
  "-filter_complex", "[1:a]aresample=48000,highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=11[a]",
  "-map", "0:v", "-map", "[a]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
  "-shortest", outPath,
]);
rmSync(tmp, { recursive: true, force: true });
console.log("Vídeo:", outPath);

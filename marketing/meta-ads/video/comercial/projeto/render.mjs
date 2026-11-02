// Render do comercial ROTA INVISÍVEL (9:16, 1080×1920, 30 fps, H.264 + AAC).
//
//   node render.mjs cues   <timeline.json> <cues.json>                 → gera a lista de efeitos sonoros/visuais
//   node render.mjs preview <timeline.json> <cues.json> <t1,t2,...> <dir>   → quadros de revisão em PNG
//   node render.mjs video  <timeline.json> <cues.json> <voz> <sfx> <musica> <ambiente> <saida.mp4>
//   node render.mjs srt    <timeline.json> <saida.srt>
//
// As cenas (comercial.html) e o som (gerar-audio.py) leem os mesmos cues, então tudo fica sincronizado
// com qualquer narração — a guia sintética ou uma regravação com voz humana.
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const [mode, tlPath, ...rest] = process.argv.slice(2);
const TL = JSON.parse(readFileSync(tlPath, "utf8"));
const L = Object.fromEntries(TL.linhas.map((l) => [l.id, l]));
const at = (id, f) => +(L[id].start + (L[id].end - L[id].start) * f).toFixed(3);
const FPS = 30, W = 1080, H = 1920;

// ------------------------------------------------------------------ cues (cada som tem uma função na narrativa)
function buildCues() {
  const c = [];
  const add = (t, kind, o = {}) => c.push({ t: +t.toFixed(3), kind, ...o });
  // 1 · gancho: o celular vibra, o saldo despenca, a constatação
  add(0, "ambience", { dur: L.b1.start - .35 });           // noite, chuva fina, geladeira: o quarto de quem está preocupado
  add(0.12, "notif", { tag: "notif" });
  add(0.35, "countdown", { dur: L.h1.end - .1 });            // dígitos rolando para baixo
  add(L.h2.end - .55, "bass", { tag: "zero", shake: 10 });   // "já acabou" → saldo zera
  add(L.h2.end - .55, "glitch", { dur: .3 });
  // 2 · dor
  const s2 = L.p1.start - .3;
  add(s2, "whoosh", { flash: .15 });
  add(s2 + .2, "ticks", { dur: L.p1.end - s2 - .1 });        // relógio + dias riscados
  add(L.p2.start - .2, "slide");
  add(L.p2.start + .45, "stamp", { tag: "stamp", shake: 6 }); // "paga uma conta"
  const chega = at("p2", .62);
  [0, .26, .5].forEach((d) => add(chega + d, "thud", { tag: "drop", shake: 5 })); // "e chega outra"
  [0.55, 1.35, 2.15].forEach((d) => add(L.p3.start + d, "flip", { tag: "flip" })); // mês que vem, de novo
  // 3 · quebra de crença: silêncio, pergunta, bússola, revelação
  const s3 = L.b1.start - .35;
  add(s3, "glitch", { dur: .35 });
  add(s3, "cut");                                             // a trilha some: silêncio estratégico
  add(L.b1.end - .05, "scratch");                             // risco sobre "dinheiro"
  add(L.b2.start - .05, "spin", { dur: L.b2.end - L.b2.start });
  add(L.b2.end - .15, "lock", { tag: "lock" });
  const reveal = L.b3.start - .2;
  add(L.b1.start + .2, "riser", { dur: reveal - L.b1.start - .2 });
  add(reveal, "impact", { tag: "reveal", shake: 12, leak: 1, flash: .55 });
  add(reveal + .15, "shimmer");
  [0, .36, .66].forEach((f, i) => { const t = at("b4", f) - .05; add(t, "pop", { tag: "pin" + i }); add(t + .03, "ding", { k: i }); });
  // 4 · produto
  const s4 = L.r1.start - .3;
  add(s4 - .9, "riser", { dur: .9 });
  add(s4, "whoosh", { leak: .8, flash: .35 });
  add(s4 + .75, "impact", { tag: "bookLand", soft: true, shake: 4 });
  add(s4 + 1.3, "shine", { tag: "bookShine" });
  ["r2", "r3", "r4", "r5"].forEach((id) => add(L[id].start - .25, "swipe"));
  add(L.r2.start, "count", { dur: .9 });
  add(at("r2", .55), "ding", { tag: "online", k: 1 });
  add(at("r2", .8), "ding", { tag: "offline", k: 2 });
  for (let i = 0; i < 6; i++) add(L.r3.start + .05 + i * .12, "pop", { tag: "tile" + i, k: i });
  [0, .45, .9].forEach((d) => add(L.r4.start + .25 + d, "ping"));
  [0, .3, .62, .9].forEach((f, i) => add(at("r5", f), "ding", { tag: "wk" + i, k: i }));
  // 5 · clímax e chamada
  const s5 = L.c1.start - .3;
  add(s5, "whoosh");
  const climax = at("c1", .5);
  add(L.c1.start + .2, "riser", { dur: climax - L.c1.start - .2 });
  add(climax, "impact", { tag: "climax", shake: 14, leak: 1, flash: .5 });
  add(climax, "bass");
  add(L.c2.start - .1, "shine", { tag: "logo", leak: .7 });
  add(L.c2.start + 1.25, "pop", { tag: "cta", k: 2 });
  add(L.c3.start, "tap", { tag: "tap" });
  add(TL.duration - 1.6, "tail");
  return c.sort((a, b) => a.t - b.t);
}

if (mode === "cues") {
  writeFileSync(rest[0], JSON.stringify(buildCues(), null, 1));
  console.log("cues:", rest[0]);
  process.exit(0);
}

if (mode === "srt") {
  const ts = (s) => { const ms = Math.round(s * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
  const srt = TL.linhas.map((l, i) => `${i + 1}\n${ts(l.start)} --> ${ts(l.end + Math.min(.4, l.pausa))}\n${l.legenda}\n`).join("\n");
  writeFileSync(rest[0], srt);
  console.log("srt:", rest[0]);
  process.exit(0);
}

// ------------------------------------------------------------------ navegador
const { chromium } = createRequire(import.meta.url)("playwright");
const CUES = JSON.parse(readFileSync(rest[0], "utf8"));
const html = readFileSync(path.join(here, "comercial.html"), "utf8")
  .replace("<script>", `<script>window.TL=${JSON.stringify(TL)};window.CUES=${JSON.stringify(CUES)};</script><script>`);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);

if (mode === "preview") {
  const [list, dir] = rest.slice(1);
  mkdirSync(dir, { recursive: true });
  for (const t of list.split(",").map(Number)) {
    await page.evaluate((x) => window.draw(x), t);
    await page.screenshot({ path: path.join(dir, `prev-${t.toFixed(2)}.png`) });
  }
  console.log("prévia ok", errors.length ? errors : "");
  await browser.close();
  process.exit(0);
}

const [voice, sfx, music, amb, out] = rest.slice(1);
const frames = Math.ceil(TL.duration * FPS);
const tmp = path.join(path.dirname(out), ".frames");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.draw(t), f / FPS);
  await page.screenshot({ path: path.join(tmp, `${String(f).padStart(5, "0")}.jpg`), type: "jpeg", quality: 92 });
  if (f % 150 === 0) console.log(`quadro ${f}/${frames}`);
}
await browser.close();
if (errors.length) console.log("avisos do navegador:", errors.slice(0, 5));

// mixagem: voz na frente; efeitos para pontuar; trilha e ambiente abaixam quando a voz fala (sidechain)
execFileSync("ffmpeg", [
  "-y", "-loglevel", "error",
  "-framerate", String(FPS), "-i", path.join(tmp, "%05d.jpg"),
  "-i", voice, "-i", sfx, "-i", music, "-i", amb,
  "-filter_complex", [
    // voz: limpeza leve (passa-alta, presença, compressão) e nível de transmissão
    "[1:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=80,equalizer=f=3200:t=q:w=1.2:g=2.5,equalizer=f=250:t=q:w=1:g=-2,acompressor=threshold=0.1:ratio=3:attack=8:release=120,loudnorm=I=-16:TP=-2:LRA=9,asplit=3[v][k1][k2]",
    "[2:a]aresample=48000,loudnorm=I=-23:TP=-2.5:LRA=18[fx]",
    "[3:a]aresample=48000,loudnorm=I=-26:TP=-4:LRA=12[mus]",
    "[4:a]aresample=48000,loudnorm=I=-36:TP=-10:LRA=10[amb]",
    "[mus][k1]sidechaincompress=threshold=0.04:ratio=5:attack=25:release=400[md]",
    "[amb][k2]sidechaincompress=threshold=0.04:ratio=4:attack=25:release=400[ad]",
    "[v][fx][md][ad]amix=inputs=4:normalize=0:duration=first,alimiter=limit=0.89,loudnorm=I=-14:TP=-1.2:LRA=10[a]",
  ].join(";"),
  "-map", "0:v", "-map", "[a]",
  "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-profile:v", "high", "-level", "4.1",
  "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv", "-r", String(FPS), "-movflags", "+faststart",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest", out,
]);
rmSync(tmp, { recursive: true, force: true });
console.log("Vídeo:", out);

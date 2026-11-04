// Base visual das folhas do kit Traço & Conta (A4, pronto para imprimir).
import { readFileSync } from "node:fs";
import path from "node:path";

const here = path.dirname(new URL(import.meta.url).pathname);
const font = (f) => `data:font/woff2;base64,${readFileSync(path.join(here, "fontes", f)).toString("base64")}`;

export const COR = {
  azul: "#2563eb", azulClaro: "#dbeafe", laranja: "#f97316", laranjaClaro: "#ffedd5", verde: "#16a34a", verdeClaro: "#dcfce7",
  rosa: "#db2777", rosaClaro: "#fce7f3", roxo: "#7c3aed", roxoClaro: "#ede9fe", amarelo: "#eab308", amareloClaro: "#fef9c3",
  tinta: "#1e293b", cinza: "#64748b", linha: "#cbd5e1",
};
/** cada módulo tem uma cor; [forte, clara] */
export const TEMA = {
  motora: ["#0891b2", "#cffafe"], alfabeto: ["#db2777", "#fce7f3"], silabas: ["#7c3aed", "#ede9fe"], complexas: ["#9333ea", "#f3e8ff"],
  ortografia: ["#e11d48", "#ffe4e6"], leitura: ["#2563eb", "#dbeafe"], numeros: ["#ea580c", "#ffedd5"], matematica: ["#16a34a", "#dcfce7"],
  logica: ["#ca8a04", "#fef9c3"], labirintos: ["#0d9488", "#ccfbf1"], caca: ["#4f46e5", "#e0e7ff"], desenho: ["#c026d3", "#fae8ff"],
  bonus: ["#f59e0b", "#fef3c7"],
};

/** gerador pseudoaleatório determinístico (mesmas folhas a cada geração) */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  r.int = (a, b) => a + Math.floor(r() * (b - a + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  return r;
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
export const uniq = (a) => [...new Set(a)];

export const CSS = `
@font-face { font-family: Fredoka; font-weight: 500; src: url(${font("fredoka-latin-500-normal.woff2")}) format("woff2"); }
@font-face { font-family: Fredoka; font-weight: 600; src: url(${font("fredoka-latin-600-normal.woff2")}) format("woff2"); }
@font-face { font-family: Fredoka; font-weight: 700; src: url(${font("fredoka-latin-700-normal.woff2")}) format("woff2"); }
@font-face { font-family: Nunito; font-weight: 400; src: url(${font("nunito-latin-400-normal.woff2")}) format("woff2"); }
@font-face { font-family: Nunito; font-weight: 700; src: url(${font("nunito-latin-700-normal.woff2")}) format("woff2"); }
@font-face { font-family: Nunito; font-weight: 800; src: url(${font("nunito-latin-800-normal.woff2")}) format("woff2"); }
@font-face { font-family: Nunito; font-weight: 900; src: url(${font("nunito-latin-900-normal.woff2")}) format("woff2"); }
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: Nunito, "Noto Color Emoji", sans-serif; color: ${COR.tinta}; background: #e5e7eb; }
.e { font-family: "Noto Color Emoji"; line-height: 1; }
.page { width: 210mm; height: 297mm; background: #fff; position: relative; overflow: hidden; break-after: page; padding: 11mm 12mm 14mm; display: flex; flex-direction: column; }
.page::before { content: ""; position: absolute; inset: 5mm; border: 1.2mm dashed var(--c2); border-radius: 7mm; pointer-events: none; }
.head { position: relative; display: flex; gap: 6mm; font-weight: 800; font-size: 11pt; color: ${COR.cinza}; margin-bottom: 4mm; }
.head span { flex: 1; border-bottom: 1.5px solid ${COR.linha}; padding-bottom: 1mm; }
.head span.d { flex: 0 0 48mm; }
.ttl { position: relative; display: flex; align-items: center; gap: 4mm; margin-bottom: 3mm; }
.tag { background: var(--c1); color: #fff; font-family: Fredoka; font-weight: 600; font-size: 10pt; letter-spacing: .06em; text-transform: uppercase; padding: 1.4mm 3.4mm; border-radius: 99px; white-space: nowrap; }
h1 { font-family: Fredoka; font-weight: 700; font-size: 24pt; line-height: 1.05; color: ${COR.tinta}; }
h1 b { color: var(--c1); font-weight: 700; }
.inst { position: relative; display: flex; align-items: center; gap: 2.5mm; font-weight: 800; font-size: 13pt; margin: 3mm 0 2.5mm; }
.inst i { font-style: normal; display: grid; place-items: center; width: 7.5mm; height: 7.5mm; border-radius: 50%; background: var(--c1); color: #fff; font-family: Fredoka; font-size: 12pt; flex-shrink: 0; }
.body { position: relative; flex: 1; display: flex; flex-direction: column; gap: 3mm; min-height: 0; }
.box { border: 1.6px solid var(--c2); border-radius: 4mm; padding: 3mm 4mm; background: #fff; }
.soft { background: var(--c2); border-color: var(--c2); }
.foot { position: absolute; left: 12mm; right: 12mm; bottom: 7.5mm; display: flex; justify-content: space-between; font-size: 7.5pt; font-weight: 800; color: #94a3b8; letter-spacing: .05em; }
.foot b { color: var(--c1); font-family: Fredoka; font-weight: 600; letter-spacing: 0; font-size: 9pt; }
.line { border-bottom: 1.5px solid ${COR.linha}; height: 9mm; }
.write { height: 12mm; border-bottom: 1.5px solid ${COR.linha}; background: linear-gradient(transparent calc(50% - .6px), #e2e8f0 calc(50% - .6px), #e2e8f0 calc(50% + .6px), transparent calc(50% + .6px)); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
.grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
.grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3mm; }
.cell { border: 1.6px solid var(--c2); border-radius: 4mm; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5mm; padding: 2.5mm; }
.slot { display: inline-block; min-width: 15mm; height: 11mm; border: 1.5px solid ${COR.linha}; border-radius: 2mm; vertical-align: middle; background: #fff; }
.word { font-family: Fredoka; font-weight: 500; font-size: 15pt; }
.big { font-family: Fredoka; font-weight: 600; }
.key { font-size: 9pt; }
.center { text-align: center; }
svg { display: block; }
`;

/** folha A4 */
export function page({ tag, title, mod, code, body, head = true }) {
  const [c1, c2] = TEMA[mod] ?? TEMA.bonus;
  return `<section class="page" style="--c1:${c1};--c2:${c2}">
    ${head ? `<div class="head"><span>Nome:</span><span class="d">Data: ____/____/______</span></div>` : ""}
    <div class="ttl"><span class="tag">${esc(tag)}</span><h1>${title}</h1></div>
    <div class="body">${body}</div>
    <div class="foot"><b>Traço &amp; Conta</b><span>${esc(code)}</span></div>
  </section>`;
}

export const inst = (n, txt) => `<div class="inst"><i>${n}</i>${txt}</div>`;
export const em = (e, size = 14) => `<span class="e" style="font-size:${size}mm">${e}</span>`;

/** texto pontilhado para cobrir (SVG) */
export function dashed(text, { size = 30, w = null, color = "#8a9bb3", fill = "#f8fafc", weight = 600, dash = null } = {}) {
  dash = dash ?? `${(size * 0.075).toFixed(2)} ${(size * 0.06).toFixed(2)}`;
  const width = w ?? Math.max(size * 0.72 * [...text].length, size * 0.8);
  return `<svg width="${width}mm" height="${size * 1.18}mm" viewBox="0 0 ${width} ${size * 1.18}"><text x="${width / 2}" y="${size * 0.9}" text-anchor="middle" font-family="Fredoka" font-weight="${weight}" font-size="${size}" fill="${fill}" stroke="${color}" stroke-width="${Math.max(size / 30, 0.55).toFixed(2)}" stroke-dasharray="${dash}" stroke-linejoin="round">${esc(text)}</text></svg>`;
}

/** pauta de caligrafia com o modelo pontilhado repetido */
export function traceRow(text, { size = 16, reps = 6, solidFirst = true } = {}) {
  const items = Array.from({ length: reps }, (_, i) =>
    i === 0 && solidFirst
      ? `<svg width="${size * 0.9 * [...text].length}mm" height="${size * 1.18}mm" viewBox="0 0 ${size * 0.9 * [...text].length} ${size * 1.18}"><text x="${size * 0.45 * [...text].length}" y="${size * 0.9}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="${size}" fill="var(--c1)">${esc(text)}</text></svg>`
      : dashed(text, { size, w: size * 0.9 * [...text].length }),
  ).join("");
  return `<div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1.5px solid ${COR.linha};padding:1.5mm 2mm">${items}</div>`;
}

export function doc(pages, title) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${pages.join("\n")}</body></html>`;
}

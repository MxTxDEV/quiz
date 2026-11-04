// Módulos de matemática, lógica e passatempos do kit Traço & Conta.
import { page, inst, em, dashed, traceRow, esc, rng } from "./lib.mjs";
import { temasCaca } from "./dados.mjs";

const NOMES = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze", "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove", "vinte"];
const OBJ = ["🍎", "⭐", "🐟", "🌸", "🚗", "🐞", "🎈", "🍓", "🐤", "⚽", "🍪", "🦋", "🍌", "🐢", "🧁", "🌼", "🐝", "🍇", "🐸", "🍩", "🐠"];
const grupo = (e, n, size = 9, max = 5) => `<div style="display:grid;grid-template-columns:repeat(${Math.min(n, max) || 1},auto);gap:1mm;justify-content:center">${Array.from({ length: n }, () => em(e, size)).join("")}</div>`;

// ------------------------------------------------------------ 9. Números 0 a 20
export function numeros() {
  const pages = [];
  for (let n = 0; n <= 20; n++) {
    const e = OBJ[n % OBJ.length];
    const s = String(n);
    const pintar = Array.from({ length: Math.max(10, n <= 10 ? 10 : 20) }, () => `<svg width="13mm" height="13mm" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.4" fill="#fff" stroke="var(--c1)" stroke-width="1.2"/></svg>`).join("");
    pages.push(page({ mod: "numeros", tag: "Números", title: `Número <b>${n}</b>`, code: `NUM-${String(n).padStart(2, "0")}`, body:
      `<div style="display:flex;gap:4mm"><div class="box soft" style="flex:0 0 80mm;display:grid;place-items:center">${dashed(s, { size: 58, w: s.length * 40 })}</div>
       <div class="box" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3mm">${n ? grupo(e, n, n > 10 ? 7 : 9) : `<span style="font-size:13pt;font-weight:800;color:#64748b">zero = nenhum objeto</span>`}${dashed(NOMES[n], { size: 13, w: Math.max(NOMES[n].length * 8, 30) })}</div></div>` +
      inst(1, `Cubra o número <b style="color:var(--c1)">${n}</b>.`) + traceRow(s, { size: 20, reps: s.length > 1 ? 6 : 8 }) +
      inst(2, `Escreva o número ${n} sozinho.`) + `<div class="write"></div>` +
      inst(3, `Pinte <b style="color:var(--c1)">${n}</b> ${n === 1 ? "bolinha" : "bolinhas"}.`) + `<div class="box" style="display:flex;flex-wrap:wrap;gap:2.5mm;justify-content:center">${pintar}</div>` +
      inst(4, `Desenhe ${n} ${n === 1 ? "objeto" : "objetos"} que você quiser.`) + `<div class="box" style="flex:1"></div>` }));
  }
  return { key: "09-numeros-0-a-20", nome: "Números de 0 a 20", pages };
}

// ------------------------------------------------------------ 10. Quantidades e comparação
export function quantidades() {
  const pages = [], gab = [];
  const r = rng(41);
  for (let p = 0; p < 8; p++) {
    const max = p < 4 ? 10 : 15;
    const itens = Array.from({ length: 6 }, (_, i) => [OBJ[(p * 6 + i) % OBJ.length], r.int(1, max)]);
    const cells = itens.map(([e, n]) => `<div class="cell" style="height:62mm;justify-content:space-between">${grupo(e, n, n > 10 ? 7.5 : 9)}<span class="slot" style="min-width:20mm;height:13mm"></span></div>`).join("");
    pages.push(page({ mod: "matematica", tag: "Quantidades", title: `Conte e <b>escreva</b> ${p + 1}`, code: `QTD-${p + 1}`, body: inst(1, "Conte as figuras e escreva o número no quadrinho.") + `<div class="grid2" style="flex:1">${cells}</div>` }));
    gab.push([`Conte e escreva ${p + 1}`, itens.map(([e, n]) => `${e} ${n}`)]);
  }
  for (let p = 0; p < 4; p++) {
    const linhas = Array.from({ length: 4 }, (_, i) => {
      const a = r.int(1, 9), b = r.int(1, 9) === a ? a + 1 : r.int(1, 9);
      const e1 = OBJ[(p * 8 + i * 2) % OBJ.length], e2 = OBJ[(p * 8 + i * 2 + 1) % OBJ.length];
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm"><div class="cell" style="height:44mm">${grupo(e1, a, 8)}</div><div class="cell" style="height:44mm">${grupo(e2, b, 8)}</div></div>`;
    }).join("");
    pages.push(page({ mod: "matematica", tag: "Quantidades", title: `Onde tem <b>mais</b>? ${p + 1}`, code: `CMP-${p + 1}`, body: inst(1, "Em cada linha, circule o quadro que tem MAIS figuras.") + linhas }));
  }
  return { key: "10-quantidades", nome: "Quantidades e comparação", pages, gab };
}

// ------------------------------------------------------------ 11. Adição e subtração
export function contas() {
  const pages = [], gab = [];
  const r = rng(53);
  // com figuras (até 10)
  for (let p = 0; p < 8; p++) {
    const sub = p >= 4;
    const items = Array.from({ length: 5 }, (_, i) => {
      const e = OBJ[(p * 5 + i) % OBJ.length];
      if (!sub) { const a = r.int(1, 5), b = r.int(1, 5); return [`${grupo(e, a, 8, 5)}<span class="big" style="font-size:24pt;color:var(--c1)">+</span>${grupo(e, b, 8, 5)}`, `${a} + ${b} = ${a + b}`, `${a} + ${b} =`]; }
      const a = r.int(3, 9), b = r.int(1, a - 1);
      const figs = Array.from({ length: a }, (_, k) => `<span style="position:relative;display:inline-block">${em(e, 8)}${k >= a - b ? `<svg style="position:absolute;inset:0" viewBox="0 0 10 10" width="8mm" height="8mm"><path d="M1 1 L9 9 M9 1 L1 9" stroke="#e11d48" stroke-width="1.2"/></svg>` : ""}</span>`).join("");
      return [`<div style="display:grid;grid-template-columns:repeat(5,auto);gap:1mm">${figs}</div>`, `${a} − ${b} = ${a - b}`, `${a} − ${b} =`];
    });
    const rows = items.map(([fig, , expr]) => `<div class="cell" style="flex-direction:row;justify-content:space-between;height:40mm;padding:3mm 6mm"><div style="display:flex;align-items:center;gap:4mm">${fig}</div><span class="big" style="font-size:24pt;white-space:nowrap">${expr} <span class="slot" style="min-width:18mm;height:14mm"></span></span></div>`).join("");
    pages.push(page({ mod: "matematica", tag: sub ? "Subtração" : "Adição", title: sub ? `Tire e <b>conte</b> ${p - 3}` : `Junte e <b>conte</b> ${p + 1}`, code: `${sub ? "SUB" : "ADI"}-F${(p % 4) + 1}`, body: inst(1, sub ? "Os objetos riscados foram embora. Quantos sobraram?" : "Conte tudo e escreva o resultado.") + rows }));
    gab.push([sub ? `Tire e conte ${p - 3}` : `Junte e conte ${p + 1}`, items.map((x) => x[1])]);
  }
  // numéricas (armadas), níveis crescentes
  const niveis = [["Adição até 10", "+", 10], ["Adição até 10", "+", 10], ["Adição até 20", "+", 20], ["Adição até 20", "+", 20], ["Adição até 20", "+", 20], ["Adição com dezenas", "+", 99],
    ["Subtração até 10", "−", 10], ["Subtração até 10", "−", 10], ["Subtração até 20", "−", 20], ["Subtração até 20", "−", 20], ["Subtração até 20", "−", 20], ["Subtração com dezenas", "−", 99]];
  niveis.forEach(([nome, op, max], p) => {
    const cont = Array.from({ length: 12 }, () => {
      let a, b;
      if (max === 99) {
        // dezenas sem reagrupamento (adequado ao 1º e 2º ano)
        if (op === "+") { const at = r.int(1, 5), bt = r.int(1, 9 - at), au = r.int(0, 5), bu = r.int(0, 9 - au); a = at * 10 + au; b = bt * 10 + bu; }
        else { const at = r.int(3, 9), bt = r.int(1, at - 1), au = r.int(2, 9), bu = r.int(0, au); a = at * 10 + au; b = bt * 10 + bu; }
      } else if (op === "+") { a = r.int(0, max - 1); b = r.int(1, max - a); }
      else { a = r.int(2, max); b = r.int(1, a); }
      return [a, b, op === "+" ? a + b : a - b];
    });
    const cells = cont.map(([a, b]) => `<div class="cell" style="align-items:flex-end;padding:3mm 8mm;height:47mm;font-family:Fredoka;font-weight:600;font-size:26pt;line-height:1.15"><span>${a}</span><span><span style="color:var(--c1);margin-right:4mm">${op}</span>${b}</span><span style="border-top:2px solid #1e293b;width:100%;height:11mm"></span></div>`).join("");
    pages.push(page({ mod: "matematica", tag: op === "+" ? "Adição" : "Subtração", title: `<b>${nome}</b> ${p % 6 + 1}`, code: `${op === "+" ? "ADI" : "SUB"}-N${(p % 6) + 1}`, body: inst(1, "Resolva as continhas.") + `<div class="grid4" style="flex:1">${cells}</div>` }));
    gab.push([`${nome} ${p % 6 + 1}`, cont.map(([a, b, c]) => `${a} ${op} ${b} = ${c}`)]);
  });
  // problemas
  const prob = [
    ["Ana tem 3 balões e ganhou mais 2. Quantos balões Ana tem agora?", "3 + 2 = 5"], ["Havia 8 pássaros na árvore. 3 voaram. Quantos ficaram?", "8 − 3 = 5"],
    ["Pedro comeu 4 uvas de manhã e 5 à tarde. Quantas uvas ele comeu?", "4 + 5 = 9"], ["Lia tinha 10 lápis e deu 4 para o irmão. Com quantos ficou?", "10 − 4 = 6"],
    ["Na sala há 6 meninas e 7 meninos. Quantas crianças há na sala?", "6 + 7 = 13"], ["Um ônibus tinha 12 passageiros. Desceram 5. Quantos ficaram?", "12 − 5 = 7"],
    ["Vovó fez 9 bolinhos e depois mais 6. Quantos bolinhos ela fez?", "9 + 6 = 15"], ["Caio tinha 15 figurinhas e perdeu 6. Quantas sobraram?", "15 − 6 = 9"],
    ["Sofia leu 7 páginas ontem e 8 hoje. Quantas páginas ela leu?", "7 + 8 = 15"], ["Em um aquário havia 11 peixes. 4 foram para outro aquário. Quantos ficaram?", "11 − 4 = 7"],
    ["Teo tem 5 carrinhos vermelhos e 9 azuis. Quantos carrinhos ele tem?", "5 + 9 = 14"], ["Mamãe comprou 18 ovos e usou 9 no bolo. Quantos ovos sobraram?", "18 − 9 = 9"],
  ];
  for (let p = 0; p < 3; p++) {
    const ps = prob.slice(p * 4, p * 4 + 4);
    pages.push(page({ mod: "matematica", tag: "Problemas", title: `Probleminhas <b>${p + 1}</b>`, code: `PRB-${p + 1}`, body: ps.map(([q], i) => inst(i + 1, esc(q)) + `<div class="box" style="display:grid;grid-template-columns:1.4fr 1fr;gap:4mm;height:44mm"><div style="border-right:1.6px dashed var(--c2);font-size:9pt;font-weight:800;color:#94a3b8">DESENHE</div><div style="display:flex;flex-direction:column;justify-content:flex-end;font-size:9pt;font-weight:800;color:#94a3b8">CONTA<div class="write"></div>RESPOSTA<div class="write"></div></div></div>`).join("") }));
    gab.push([`Probleminhas ${p + 1}`, ps.map((x) => x[1])]);
  }
  return { key: "11-adicao-e-subtracao", nome: "Adição e subtração", pages, gab };
}

// ------------------------------------------------------------ 12. Lógica: sequências, antes e depois
export function logica() {
  const pages = [], gab = [];
  const r = rng(61);
  const PAD = [[0, 1], [0, 0, 1], [0, 1, 2], [0, 1, 1], [0, 0, 1, 1], [0, 1, 2, 3]];
  for (let p = 0; p < 6; p++) {
    const res = [];
    const rows = Array.from({ length: 6 }, (_, i) => {
      const pad = PAD[(p + i) % PAD.length];
      const es = r.shuffle(OBJ).slice(0, 4);
      const seq = Array.from({ length: 9 }, (_, k) => es[pad[k % pad.length]]);
      res.push(seq.slice(6).join(" "));
      return `<div class="cell" style="flex-direction:row;justify-content:flex-start;gap:2mm;height:30mm">${seq.slice(0, 6).map((e) => em(e, 11)).join("")}${[0, 1, 2].map(() => `<span class="slot" style="min-width:16mm;height:16mm"></span>`).join("")}</div>`;
    }).join("");
    pages.push(page({ mod: "logica", tag: "Lógica", title: `Complete a <b>sequência</b> ${p + 1}`, code: `SEQ-${p + 1}`, body: inst(1, "Descubra o padrão e desenhe as figuras que continuam a sequência.") + rows }));
    gab.push([`Complete a sequência ${p + 1}`, res]);
  }
  for (let p = 0; p < 4; p++) {
    const max = p < 2 ? 20 : 50;
    const nums = Array.from({ length: 10 }, () => r.int(1, max - 1));
    const cells = nums.map((n) => `<div class="cell" style="flex-direction:row;gap:3mm;height:24mm"><span class="slot" style="min-width:20mm;height:14mm"></span><span class="big" style="font-size:26pt;background:var(--c2);border-radius:3mm;padding:0 4mm">${n}</span><span class="slot" style="min-width:20mm;height:14mm"></span></div>`).join("");
    pages.push(page({ mod: "logica", tag: "Lógica", title: `Antes e <b>depois</b> ${p + 1}`, code: `ANT-${p + 1}`, body: inst(1, "Escreva o número que vem ANTES e o que vem DEPOIS.") + `<div class="grid2">${cells}</div>` }));
    gab.push([`Antes e depois ${p + 1}`, nums.map((n) => `${n - 1} · ${n} · ${n + 1}`)]);
  }
  for (let p = 0; p < 2; p++) {
    const pares = Array.from({ length: 12 }, () => { const a = r.int(1, 30 + p * 40); let b = r.int(1, 30 + p * 40); if (b === a) b = a + 1; return [a, b]; });
    const cells = pares.map(([a, b]) => `<div class="cell" style="flex-direction:row;gap:4mm;height:25mm;font-family:Fredoka;font-weight:600;font-size:26pt">${a}<span class="slot" style="min-width:14mm;height:14mm"></span>${b}</div>`).join("");
    pages.push(page({ mod: "logica", tag: "Lógica", title: `Maior, menor ou <b>igual</b> ${p + 1}`, code: `MMI-${p + 1}`, body: `<div class="box soft" style="font-size:14pt;font-weight:800;text-align:center">Use os sinais:  &gt; maior que  ·  &lt; menor que  ·  = igual</div>` + inst(1, "Escreva o sinal certo no quadrinho.") + `<div class="grid3">${cells}</div>` }));
    gab.push([`Maior, menor ou igual ${p + 1}`, pares.map(([a, b]) => `${a} ${a > b ? ">" : a < b ? "<" : "="} ${b}`)]);
  }
  return { key: "12-logica", nome: "Lógica: sequências, antes e depois", pages, gab };
}

// ------------------------------------------------------------ 13. Formas geométricas
const FORMAS = [
  ["Círculo", "circle", (s) => `<circle cx="50" cy="50" r="40" ${s}/>`], ["Quadrado", "square", (s) => `<rect x="12" y="12" width="76" height="76" ${s}/>`],
  ["Triângulo", "tri", (s) => `<path d="M50 10 L90 86 L10 86 Z" ${s}/>`], ["Retângulo", "rect", (s) => `<rect x="4" y="26" width="92" height="50" ${s}/>`],
  ["Losango", "los", (s) => `<path d="M50 6 L90 50 L50 94 L10 50 Z" ${s}/>`], ["Estrela", "star", (s) => `<path d="M50 6 L61 38 L95 38 L67 58 L78 92 L50 71 L22 92 L33 58 L5 38 L39 38 Z" ${s}/>`],
  ["Coração", "heart", (s) => `<path d="M50 88 C 18 66, 4 44, 18 26 C 30 12, 46 18, 50 30 C 54 18, 70 12, 82 26 C 96 44, 82 66, 50 88 Z" ${s}/>`], ["Oval", "oval", (s) => `<ellipse cx="50" cy="50" rx="44" ry="30" ${s}/>`],
];
export function formas() {
  const pages = [];
  const st = `fill="none" stroke="#8a9bb3" stroke-width="2.2" stroke-dasharray="6 5" stroke-linejoin="round"`;
  FORMAS.forEach(([nome, , f], i) => {
    const big = `<svg viewBox="0 0 100 100" width="70mm" height="70mm">${f(st)}</svg>`;
    const small = Array.from({ length: 8 }, () => `<svg viewBox="0 0 100 100" width="30mm" height="30mm">${f(st.replace("2.2", "3").replace("6 5", "8 6"))}</svg>`).join("");
    pages.push(page({ mod: "logica", tag: "Formas geométricas", title: `<b>${nome}</b>`, code: `FOR-${i + 1}`, body: `<div class="box soft" style="display:flex;align-items:center;justify-content:space-around">${big}<span class="big" style="font-size:30pt">${nome}</span></div>` + inst(1, `Cubra as formas e pinte cada ${nome.toLowerCase()} de uma cor.`) + `<div class="box" style="display:grid;grid-template-columns:repeat(4,1fr);justify-items:center;gap:3mm;flex:1;align-content:space-around">${small}</div>` + inst(2, `Desenhe um objeto que tenha a forma de ${nome === "Estrela" ? "uma estrela" : nome === "Oval" ? "uma forma oval" : "um " + nome.toLowerCase()}.`) + `<div class="box" style="height:42mm"></div>` }));
  });
  return { key: "13-formas-geometricas", nome: "Formas geométricas", pages };
}

// ------------------------------------------------------------ 14. Labirintos
function maze(cols, rows, seed) {
  const r = rng(seed);
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ n: 1, s: 1, e: 1, w: 1, v: 0 })));
  const stack = [[0, 0]]; cells[0][0].v = 1;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nb = [[0, -1, "n", "s"], [0, 1, "s", "n"], [1, 0, "e", "w"], [-1, 0, "w", "e"]].filter(([dx, dy]) => cells[y + dy]?.[x + dx] && !cells[y + dy][x + dx].v);
    if (!nb.length) { stack.pop(); continue; }
    const [dx, dy, a, b] = r.pick(nb);
    cells[y][x][a] = 0; cells[y + dy][x + dx][b] = 0; cells[y + dy][x + dx].v = 1; stack.push([x + dx, y + dy]);
  }
  return cells;
}
export function labirintos() {
  const pages = [];
  const PAR = [["🐭", "🧀"], ["🐝", "🌻"], ["🐶", "🦴"], ["🐰", "🥕"], ["🚀", "🪐"], ["🐵", "🍌"], ["🐱", "🐟"], ["🐻", "🍯"], ["🐦", "🪺"], ["🚗", "🏠"]];
  for (let p = 0; p < 20; p++) {
    const cols = 6 + Math.floor(p / 2), rows = Math.round(cols * 1.25);
    const m = maze(cols, rows, 100 + p);
    const W = 170, cs = W / cols, H = cs * rows;
    let d = "";
    m.forEach((row, y) => row.forEach((c, x) => {
      const X = x * cs, Y = y * cs;
      if (c.n && !(x === 0 && y === 0)) d += `M${X} ${Y}h${cs}`;
      if (c.w) d += `M${X} ${Y}v${cs}`;
      if (y === rows - 1 && !(x === cols - 1)) d += `M${X} ${Y + cs}h${cs}`;
      if (x === cols - 1 && !(y === rows - 1)) d += `M${X + cs} ${Y}v${cs}`;
    }));
    const [a, b] = PAR[p % PAR.length];
    const maxH = 205;
    const scale = Math.min(1, maxH / H);
    pages.push(page({ mod: "labirintos", tag: "Labirinto", title: `Labirinto <b>${p + 1}</b>`, code: `LAB-${String(p + 1).padStart(2, "0")}`, body: inst(1, `Ajude ${a} a chegar até ${b}. Trace o caminho com o lápis.`) +
      `<div style="flex:1;display:flex;align-items:center;justify-content:center;gap:2mm"><div style="display:flex;flex-direction:column;justify-content:space-between;align-self:stretch">${em(a, 13)}<span></span></div>
       <svg viewBox="-2 -2 ${W + 4} ${H + 4}" width="${(W + 4) * scale}mm" height="${(H + 4) * scale}mm"><path d="${d}" stroke="var(--c1)" stroke-width="${Math.max(1.4, 2.6 - p * 0.06)}" stroke-linecap="round" fill="none"/></svg>
       <div style="display:flex;flex-direction:column;justify-content:space-between;align-self:stretch"><span></span>${em(b, 13)}</div></div>` }));
  }
  return { key: "14-labirintos", nome: "Labirintos", pages };
}

// ------------------------------------------------------------ 15. Caça-palavras
function cacaGrid(words, size, seed, diag) {
  const r = rng(seed);
  const g = Array.from({ length: size }, () => Array(size).fill(""));
  const pos = [];
  const dirs = diag ? [[1, 0], [0, 1], [1, 1]] : [[1, 0], [0, 1]];
  for (const w of words) {
    for (let t = 0; t < 400; t++) {
      const [dx, dy] = r.pick(dirs);
      const x = r.int(0, size - 1 - dx * (w.length - 1)), y = r.int(0, size - 1 - dy * (w.length - 1));
      if ([...w].every((c, i) => !g[y + dy * i][x + dx * i] || g[y + dy * i][x + dx * i] === c)) {
        [...w].forEach((c, i) => (g[y + dy * i][x + dx * i] = c)); pos.push([w, x, y, dx, dy]); break;
      }
    }
  }
  const A = "ABCDEFGHIJLMNOPRSTUVZ";
  for (const row of g) for (let i = 0; i < size; i++) if (!row[i]) row[i] = A[r.int(0, A.length - 1)];
  return { g, pos };
}
export function caca() {
  const pages = [], gabPages = [];
  temasCaca.forEach(([tema, words], i) => {
    const size = i < 8 ? 10 : 12;
    const { g, pos } = cacaGrid(words, size, 300 + i, i >= 8);
    const cs = 15;
    const grid = (sol) => `<svg viewBox="0 0 ${size * cs} ${size * cs}" width="${sol ? 70 : 168}mm" height="${sol ? 70 : 168}mm">${sol ? pos.map(([w, x, y, dx, dy]) => `<line x1="${x * cs + cs / 2}" y1="${y * cs + cs / 2}" x2="${(x + dx * (w.length - 1)) * cs + cs / 2}" y2="${(y + dy * (w.length - 1)) * cs + cs / 2}" stroke="#fde047" stroke-width="${cs * 0.8}" stroke-linecap="round"/>`).join("") : ""}${g.map((row, y) => row.map((c, x) => `<text x="${x * cs + cs / 2}" y="${y * cs + cs * 0.72}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="${cs * 0.62}" fill="#1e293b">${c}</text>`).join("")).join("")}</svg>`;
    pages.push(page({ mod: "caca", tag: "Caça-palavras", title: `Caça-palavras: <b>${esc(tema)}</b>`, code: `CAC-${String(i + 1).padStart(2, "0")}`, body: inst(1, `Encontre as palavras ${i >= 8 ? "(na horizontal, na vertical e na diagonal)" : "(na horizontal e na vertical)"}.`) + `<div class="box" style="display:grid;place-items:center">${grid(false)}</div>` + `<div class="box soft" style="display:flex;flex-wrap:wrap;gap:3mm 6mm;justify-content:center">${words.map((w) => `<span class="word" style="font-size:16pt">☐ ${w}</span>`).join("")}</div>` }));
    gabPages.push(`<div class="box" style="text-align:center"><b style="font-family:Fredoka">${esc(tema)}</b>${grid(true)}</div>`);
  });
  return { key: "15-caca-palavras", nome: "Caça-palavras", pages, gabHtml: gabPages };
}

// ------------------------------------------------------------ 16. Desenho no quadriculado
const PIX = {
  Coração: ["0110110", "1111111", "1111111", "1111111", "0111110", "0011100", "0001000"], Casa: ["0001000", "0011100", "0111110", "1111111", "0110110", "0110110", "0111110"],
  Estrela: ["0001000", "0011100", "1111111", "0111110", "0011100", "0110110", "1100011"], Peixe: ["0000000", "0011100", "1111110", "0111111", "1111110", "0011100", "0000000"],
  Árvore: ["0011100", "0111110", "1111111", "0111110", "0011100", "0001000", "0011100"], Gato: ["1000001", "1100011", "1111111", "1010101", "1111111", "0111110", "0011100"],
  Sorvete: ["0011100", "0111110", "0111110", "0111110", "0011100", "0011100", "0001000"], Barco: ["0001000", "0001100", "0001110", "0001000", "1111111", "0111110", "0011100"],
  Flor: ["0101010", "1111111", "0111110", "1111111", "0101010", "0001000", "0011100"], Foguete: ["0001000", "0011100", "0011100", "0111110", "0011100", "0111110", "0101010"],
  Robô: ["0011100", "0111110", "0101010", "0111110", "1111111", "0111110", "0110110"], Borboleta: ["1100011", "1110111", "1111111", "0011100", "1111111", "1110111", "1100011"],
};
export function desenho() {
  const pages = [];
  const cores = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7"];
  Object.entries(PIX).forEach(([nome, rows], i) => {
    const n = rows.length, cs = 10;
    const grid = (fill) => `<svg viewBox="0 0 ${n * cs} ${n * cs}" width="78mm" height="78mm">${rows.map((row, y) => [...row].map((c, x) => `<rect x="${x * cs}" y="${y * cs}" width="${cs}" height="${cs}" fill="${fill && c === "1" ? cores[i % cores.length] : "#fff"}" stroke="#94a3b8" stroke-width=".5"/>`).join("")).join("")}</svg>`;
    pages.push(page({ mod: "desenho", tag: "Desenho", title: `Copie o desenho: <b>${nome}</b>`, code: `DES-${String(i + 1).padStart(2, "0")}`, body: inst(1, "Pinte os quadradinhos do lado direito igual ao modelo.") + `<div style="display:flex;justify-content:space-around;align-items:center;flex:1">${grid(true)}<span class="big" style="font-size:30pt;color:var(--c1)">→</span>${grid(false)}</div>` + inst(2, "Agora desenhe o que você quiser no quadriculado.") + `<div class="box" style="display:grid;place-items:center">${`<svg viewBox="0 0 120 60" width="160mm" height="80mm">${Array.from({ length: 12 * 6 }, (_, k) => `<rect x="${(k % 12) * 10}" y="${Math.floor(k / 12) * 10}" width="10" height="10" fill="#fff" stroke="#cbd5e1" stroke-width=".4"/>`).join("")}</svg>`}</div>` }));
  });
  return { key: "16-desenho-quadriculado", nome: "Desenho no quadriculado", pages };
}

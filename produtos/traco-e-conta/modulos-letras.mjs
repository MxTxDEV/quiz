// Módulos de linguagem do kit Traço & Conta.
import { page, inst, em, dashed, traceRow, esc, rng, uniq } from "./lib.mjs";
import { W, emoji, syl, porLetra, familias, grupos, textos } from "./dados.mjs";

const ALFA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const semAcento = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

// ------------------------------------------------------------ 1. Coordenação motora
const PARES = [["🐝", "🌸"], ["🐶", "🦴"], ["🐰", "🥕"], ["🚗", "🏠"], ["🐵", "🍌"], ["🐭", "🧀"], ["✈️", "☁️"], ["🐦", "🪺"], ["🐱", "🐟"], ["🦋", "🌻"], ["🐻", "🍯"], ["🚀", "🌙"]];
const PADROES = [
  ["Retas", (k) => "M0 15 H160"],
  ["Ondas", (k) => { let d = "M0 15"; const n = 4 + k * 2, w = 160 / n; for (let i = 0; i < n; i++) d += ` q${w / 2} ${i % 2 ? 22 : -22} ${w} 0`; return d; }],
  ["Zigue-zague", (k) => { let d = "M0 26"; const n = 6 + k * 3, w = 160 / n; for (let i = 1; i <= n; i++) d += ` L${i * w} ${i % 2 ? 4 : 26}`; return d; }],
  ["Montanhas", (k) => { let d = "M0 28"; const n = 3 + k * 2, w = 160 / n; for (let i = 0; i < n; i++) d += ` l${w / 2} -26 l${w / 2} 26`; return d; }],
  ["Arcos", (k) => { let d = "M0 26"; const n = 4 + k * 2, w = 160 / n; for (let i = 0; i < n; i++) d += ` a${w / 2} ${w / 2.2} 0 0 1 ${w} 0`; return d; }],
  ["Castelo", (k) => { let d = "M0 26"; const n = 4 + k * 2, w = 160 / n; for (let i = 0; i < n; i++) d += i % 2 ? ` v22 h${w}` : ` v-22 h${w}`; return d; }],
  ["Escada", (k) => { let d = "M0 28"; const n = 5 + k * 2, w = 160 / n; for (let i = 0; i < n; i++) d += ` h${(w / 2).toFixed(2)} v-${(24 / n).toFixed(2)} h${(w / 2).toFixed(2)}`; return d; }],
  ["Laços", (k) => { const n = 4 + k * 2, w = 160 / n, pts = []; for (let t = 0; t <= n * 40; t++) { const a = (t / 40) * Math.PI * 2; pts.push([(t / 40) * w - Math.sin(a) * w * 0.55, 16 - Math.cos(a) * 11]); } return "M" + pts.map(([x, y]) => `${Math.max(0, x).toFixed(1)} ${y.toFixed(1)}`).join(" L"); }],
  ["Curvas grandes", (k) => `M0 15 C 30 -10, 50 40, 80 15 S 130 -10, 160 15`],
  ["Picos", (k) => { let d = "M0 15"; const n = 5 + k * 2, w = 160 / n; for (let i = 0; i < n; i++) d += ` l${w / 2} ${i % 2 ? 12 : -12} l${w / 2} ${i % 2 ? -12 : 12}`; return d; }],
  ["Molas", (k) => { const n = 6 + k * 3, w = 160 / n, pts = []; for (let t = 0; t <= n * 30; t++) { const a = (t / 30) * Math.PI * 2; pts.push([(t / 30) * w + Math.sin(a) * w * 0.35, 15 - Math.cos(a) * 8]); } return "M" + pts.map(([x, y]) => `${Math.max(0, Math.min(160, x)).toFixed(1)} ${y.toFixed(1)}`).join(" L"); }],
  ["Diagonais", (k) => { let d = ""; const n = 7 + k * 3, w = 160 / n; for (let i = 0; i < n; i++) d += ` M${i * w + 2} 28 L${i * w + w - 2} 3`; return d.trim(); }],
];

export function motora() {
  const pages = [];
  PADROES.forEach(([nome, fn], i) => {
    for (const k of [0, 1]) {
      const rows = Array.from({ length: 6 }, (_, r) => {
        const [a, b] = PARES[(i * 2 + k + r) % PARES.length];
        return `<div style="display:flex;align-items:center;gap:2mm;height:33mm">${em(a, 12)}
          <svg viewBox="-4 -6 168 42" width="150mm" height="37mm"><path d="${fn(k)}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>${em(b, 12)}</div>`;
      }).join("");
      pages.push(page({ mod: "motora", tag: "Coordenação motora", title: `${nome}${k ? " <b>II</b>" : ""}`, code: `MOT-${String(pages.length + 1).padStart(2, "0")}`, body: inst(1, "Cubra o tracejado com o lápis, sem tirar da folha. Depois, pinte as figuras.") + rows }));
    }
  });
  return { key: "01-coordenacao-motora", nome: "Coordenação motora", pages };
}

// ------------------------------------------------------------ 2. Alfabeto
export function alfabeto() {
  const pages = [];
  const r = rng(7);
  for (const L of ALFA) {
    const ws = uniq(porLetra[L] ?? []);
    const distract = r.shuffle(Object.keys(W).filter((w) => semAcento(w)[0].toUpperCase() !== L)).slice(0, 6 - Math.min(ws.length, 4));
    const ex = ws.slice(0, 2).map((w) => `<div class="cell" style="flex:1">${em(emoji(w), 15)}<span class="word">${esc(w)}</span></div>`).join("");
    let atv;
    if (ws.length >= 2) {
      const cells = r.shuffle([...ws.slice(0, 4), ...distract]).map((w) => `<div class="cell" style="height:33mm">${em(emoji(w), 15)}<span class="word" style="font-size:13pt">${esc(w)}</span></div>`).join("");
      atv = inst(3, `Circule as figuras que começam com a letra <b style="color:var(--c1)">${L}</b>.`) + `<div class="grid3">${cells}</div>`;
    } else {
      const sopa = Array.from({ length: 40 }, (_, i) => (i % 5 === r.int(0, 4) ? L : r.pick(ALFA.filter((x) => x !== L))));
      atv = inst(3, `Encontre e circule todas as letras <b style="color:var(--c1)">${L}</b>.`) + `<div class="box" style="display:grid;grid-template-columns:repeat(10,1fr);gap:2mm;text-align:center">${sopa.map((c) => `<span class="big" style="font-size:20pt">${c}</span>`).join("")}</div>`;
    }
    const exTxt = L === "Y" ? `<div class="cell" style="flex:1"><span class="word">A letra Y aparece em nomes como Yasmin e Yuri.</span></div>` : ex;
    const body = `<div style="display:flex;gap:4mm;align-items:stretch"><div class="box soft" style="display:flex;align-items:center;justify-content:center;gap:2mm;flex:0 0 82mm;padding:5mm 3mm">${dashed(L, { size: 54, w: 42 })}${dashed(L.toLowerCase(), { size: 54, w: 38 })}</div>${exTxt}</div>
      ${inst(1, `Cubra a letra <b style="color:var(--c1)">${L}</b> maiúscula.`)}${traceRow(L, { size: 21, reps: 7 })}
      ${inst(2, `Agora a letra <b style="color:var(--c1)">${L.toLowerCase()}</b> minúscula.`)}${traceRow(L.toLowerCase(), { size: 21, reps: 7 })}
      ${atv}`;
    pages.push(page({ mod: "alfabeto", tag: "Alfabeto", title: `Letra <b>${L}</b>`, code: `ALF-${L}`, body }));
  }
  for (const v of [0, 1]) {
    const linhas = [0, 1, 2, 3].map((l) => {
      const ini = l * 7 + v * 2;
      const seq = Array.from({ length: 7 }, (_, i) => ALFA[(ini + i) % 26]);
      return `<div style="display:flex;gap:2.5mm;justify-content:center">${seq.map((c, i) => `<div class="cell" style="width:22mm;height:24mm">${(i + l + v) % 3 === 1 ? "" : `<span class="big" style="font-size:26pt">${c}</span>`}</div>`).join("")}</div>`;
    }).join("");
    pages.push(page({ mod: "alfabeto", tag: "Alfabeto", title: `Complete o <b>alfabeto</b>${v ? " II" : ""}`, code: `ALF-C${v + 1}`, body: inst(1, "Escreva nos quadrinhos vazios as letras que estão faltando.") + linhas + inst(2, "Escreva as letras do seu nome.") + `<div class="write"></div><div class="write"></div>` }));
  }
  return { key: "02-alfabeto", nome: "Alfabeto", pages };
}

// ------------------------------------------------------------ 3. Famílias silábicas
const VOG = ["a", "e", "i", "o", "u"];
export function silabas() {
  const pages = [];
  const r = rng(11);
  for (const [C, lista] of Object.entries(familias)) {
    const c = C.toLowerCase();
    const sil = VOG.map((v) => c + v);
    const table = `<div class="box soft" style="display:flex;justify-content:space-around">${sil.map((s) => `<div style="text-align:center">${dashed(s.toUpperCase(), { size: 21, w: 34 })}${dashed(s, { size: 21, w: 34 })}</div>`).join("")}</div>`;
    const ws = uniq(lista);
    const words = ws.map((w) => `<div class="cell" style="flex-direction:row;justify-content:flex-start;gap:3mm;height:25mm">${em(emoji(w), 14)}<span class="word">${syl(w).map((s) => (semAcento(s).startsWith(c) ? `<b style="color:var(--c1)">${s}</b>` : s)).join("-")}</span></div>`).join("");
    pages.push(page({ mod: "silabas", tag: "Sílabas", title: `Família do <b>${C}</b>`, code: `SIL-${C}1`, body:
      inst(1, "Cubra as sílabas e leia em voz alta.") + table +
      inst(2, "Leia as palavras. As sílabas da família estão destacadas.") + `<div class="grid2">${words}</div>` +
      inst(3, `Escreva três palavras que tenham sílabas da família do ${C}.`) + `<div class="write"></div><div class="write"></div><div class="write"></div>` }));
    const items = ws.map((w) => {
      const ss = syl(w);
      const idx = ss.findIndex((s) => semAcento(s).startsWith(c));
      const shown = ss.map((s, i) => (i === idx ? `<span class="slot"></span>` : s)).join("");
      return `<div class="cell" style="flex-direction:row;justify-content:flex-start;gap:4mm;height:34mm">${em(emoji(w), 17)}<span class="word" style="font-size:22pt">${shown}</span></div>`;
    }).join("");
    const misturadas = r.shuffle([...sil, ...r.shuffle(Object.keys(familias).filter((x) => x !== C)).slice(0, 5).map((x) => x.toLowerCase() + r.pick(VOG))]);
    pages.push(page({ mod: "silabas", tag: "Sílabas", title: `Complete com a família do <b>${C}</b>`, code: `SIL-${C}2`, body:
      inst(1, "Escreva a sílaba que falta em cada palavra.") + `<div class="grid2">${items}</div>` +
      inst(2, `Pinte só as sílabas da família do ${C}.`) + `<div class="box" style="display:flex;flex-wrap:wrap;gap:3mm;justify-content:center">${misturadas.map((s) => `<span class="big" style="font-size:24pt;border:1.6px solid var(--c2);border-radius:3mm;padding:1.5mm 5mm">${s}</span>`).join("")}</div>` +
      inst(3, "Copie duas palavras completas.") + `<div class="write"></div><div class="write"></div>` }));
  }
  return { key: "03-familias-silabicas", nome: "Famílias silábicas", pages };
}

// ------------------------------------------------------------ 4. Separação silábica
export function separar() {
  const pages = [], gab = [];
  const lista = Object.keys(W).filter((w) => !["zero", "cloro", "kiwi"].includes(w));
  for (let p = 0; p < 10; p++) {
    const ws = lista.slice(p * 8, p * 8 + 8);
    const rows = ws.map((w) => `<div class="cell" style="flex-direction:row;justify-content:flex-start;gap:3mm;padding:2mm 3mm;height:24mm">${em(emoji(w), 13)}<span class="word" style="width:40mm">${esc(w)}</span><span style="flex:1;display:flex;gap:2mm">${syl(w).map(() => `<span class="slot" style="flex:1;max-width:18mm"></span>`).join("")}</span><span style="font-weight:800;font-size:10pt;color:#64748b">sílabas: <span class="slot" style="min-width:9mm"></span></span></div>`).join("");
    pages.push(page({ mod: "silabas", tag: "Sílabas", title: `Separe as <b>sílabas</b> ${p + 1}`, code: `SEP-${String(p + 1).padStart(2, "0")}`, body:
      inst(1, "Escreva cada sílaba em um quadrinho. Bata palmas a cada sílaba para conferir.") + `<div style="display:flex;flex-direction:column;gap:2.4mm">${rows}</div>` +
      inst(2, "Qual palavra desta página tem mais sílabas? Escreva aqui.") + `<div class="write"></div>` }));
    gab.push([`Separe as sílabas ${p + 1}`, ws.map((w) => `${w}: ${syl(w).join("-")} (${syl(w).length})`)]);
  }
  return { key: "04-separacao-silabica", nome: "Separação silábica", pages, gab };
}

// ------------------------------------------------------------ 5. Sílabas complexas
export function complexas() {
  const pages = [];
  for (const [G, ws] of Object.entries(grupos)) {
    const g = G.toLowerCase();
    const table = `<div class="box soft" style="display:flex;justify-content:space-around">${VOG.map((v) => `<div>${dashed((g + v).toUpperCase(), { size: 15, w: 35 })}</div>`).join("")}</div>`;
    const cells = ws.map((w) => `<div class="cell" style="flex-direction:row;gap:3mm;justify-content:flex-start;height:17mm">${W[w] ? em(W[w][0], 11) : ""}<span class="word">${esc(w).replace(new RegExp(g, "i"), (m) => `<b style="color:var(--c1)">${m}</b>`)}</span></div>`).join("");
    const comp = ws.slice(0, 4).map((w) => `<div class="cell" style="flex-direction:row;gap:2mm;height:20mm"><span class="word" style="font-size:18pt">${esc(w).replace(new RegExp(g, "i"), '<span class="slot" style="min-width:16mm"></span>')}</span></div>`).join("");
    pages.push(page({ mod: "complexas", tag: "Sílabas complexas", title: `Palavras com <b>${G}</b>`, code: `CPX-${G}`, body:
      inst(1, "Cubra as sílabas e leia em voz alta.") + table +
      inst(2, "Leia as palavras.") + `<div class="grid2">${cells}</div>` +
      inst(3, `Complete com <b style="color:var(--c1)">${g}</b>.`) + `<div class="grid2">${comp}</div>` +
      inst(4, "Escreva uma frase usando uma das palavras.") + `<div class="write"></div><div class="write"></div>` }));
  }
  return { key: "05-silabas-complexas", nome: "Sílabas complexas", pages };
}

// ------------------------------------------------------------ 6. Ortografia
const ORTO = [
  { t: "M antes de P e B", regra: "Antes das letras <b>P</b> e <b>B</b>, usamos <b>M</b>. Antes das outras consoantes, usamos <b>N</b>.", alvo: ["m", "n"],
    ws: [["campo", "cam-po"], ["tambor", "tam-bor"], ["bombom", "bom-bom"], ["pombo", "pom-bo"], ["lâmpada", "lâm-pa-da"], ["sombrinha", "som-bri-nha"], ["pinguim", "pin-guim"], ["dente", "den-te"], ["elefante", "e-le-fan-te"], ["onça", "on-ça"]],
    blank: (w) => w.replace(/[mn](?=[pbtdgfç])/i, "__"), errado: (w) => w.replace(/m(?=[pb])/, "n").replace(/n(?=[tdgfç])/, "m") },
  { t: "R e RR", regra: "No começo da palavra, o <b>R</b> já tem som forte. Entre vogais, para o som forte, usamos <b>RR</b>.", alvo: ["r", "rr"],
    ws: [["rato", "ra-to"], ["rosa", "ro-sa"], ["relógio", "re-ló-gio"], ["raposa", "ra-po-sa"], ["carro", "car-ro"], ["torre", "tor-re"], ["cachorro", "ca-chor-ro"], ["pera", "pe-ra"], ["cenoura", "ce-nou-ra"], ["coruja", "co-ru-ja"]],
    blank: (w) => w.replace(/rr|r/, "__"), errado: (w) => (w.includes("rr") ? w.replace("rr", "r") : /^r/.test(w) ? "r" + w : w.replace("r", "rr")) },
  { t: "S e SS", regra: "Entre vogais, um <b>S</b> sozinho tem som de Z (casa). Para o som de S entre vogais, usamos <b>SS</b> (osso).", alvo: ["s", "ss"],
    ws: [["sapo", "sa-po"], ["sol", "sol"], ["sino", "si-no"], ["osso", "os-so"], ["massa", "mas-sa"], ["pássaro", "pás-sa-ro"], ["casa", "ca-sa"], ["rosa", "ro-sa"], ["mesa", "me-sa"], ["vaso", "va-so"]],
    blank: (w) => w.replace(/ss|s/, "__"), errado: (w) => (w.includes("ss") ? w.replace("ss", "s") : w.replace("s", "ss")) },
  { t: "CH", regra: "<b>CH</b> é um dígrafo: duas letras que formam um só som, como em <b>ch</b>uva.", alvo: ["ch"],
    ws: [["chave", "cha-ve"], ["chuva", "chu-va"], ["chapéu", "cha-péu"], ["chocolate", "cho-co-la-te"], ["cachorro", "ca-chor-ro"], ["bicho", "bi-cho"], ["chinelo", "chi-ne-lo"], ["mochila", "mo-chi-la"]],
    blank: (w) => w.replace("ch", "__"), errado: (w) => w.replace("ch", "x") },
  { t: "LH", regra: "<b>LH</b> é um dígrafo: as duas letras juntas formam um só som, como em mi<b>lh</b>o.", alvo: ["lh"],
    ws: [["abelha", "a-be-lha"], ["coelho", "co-e-lho"], ["milho", "mi-lho"], ["folha", "fo-lha"], ["ilha", "i-lha"], ["olho", "o-lho"], ["ovelha", "o-ve-lha"], ["palhaço", "pa-lha-ço"]],
    blank: (w) => w.replace("lh", "__"), errado: (w) => w.replace("lh", "li") },
  { t: "NH", regra: "<b>NH</b> é um dígrafo, como em ni<b>nh</b>o e mi<b>nh</b>oca.", alvo: ["nh"],
    ws: [["galinha", "ga-li-nha"], ["ninho", "ni-nho"], ["minhoca", "mi-nho-ca"], ["aranha", "a-ra-nha"], ["unha", "u-nha"], ["banho", "ba-nho"], ["joaninha", "jo-a-ni-nha"], ["golfinho", "gol-fi-nho"]],
    blank: (w) => w.replace("nh", "__"), errado: (w) => w.replace("nh", "ni") },
  { t: "Ç (cedilha)", regra: "O <b>Ç</b> tem som de S e aparece antes de <b>A</b>, <b>O</b> e <b>U</b>. Nunca começa palavra.", alvo: ["ç"],
    ws: [["maçã", "ma-çã"], ["coração", "co-ra-ção"], ["palhaço", "pa-lha-ço"], ["laço", "la-ço"], ["onça", "on-ça"], ["açúcar", "a-çú-car"], ["pescoço", "pes-co-ço"], ["caçula", "ca-çu-la"]],
    blank: (w) => w.replace("ç", "__"), errado: (w) => w.replace("ç", "ss") },
];
export function ortografia() {
  const pages = [];
  const r = rng(23);
  ORTO.forEach((o, i) => {
    const ilustr = o.ws.filter(([w]) => W[w]);
    const comp = o.ws.slice(0, 8).map(([w]) => `<div class="cell" style="flex-direction:row;justify-content:flex-start;gap:3mm;height:27mm">${W[w] ? em(W[w][0], 14) : `<span style="width:10mm"></span>`}<span class="word" style="font-size:17pt">${esc(o.blank(w)).replace("__", '<span class="slot"></span>')}</span></div>`).join("");
    pages.push(page({ mod: "ortografia", tag: "Ortografia", title: o.t.replace(/^(\S+)/, "<b>$1</b>"), code: `ORT-${i + 1}A`, body:
      `<div class="box soft" style="font-size:13pt;font-weight:700">💡 ${o.regra}</div>` +
      inst(1, "Complete as palavras.") + `<div class="grid2">${comp}</div>` +
      inst(2, "Escreva três palavras desta página.") + `<div class="write"></div><div class="write"></div><div class="write"></div>` }));
    const pares = r.shuffle(ilustr).slice(0, 6).map(([w]) => {
      const ops = r.shuffle([w, o.errado(w)]);
      return `<div class="cell" style="flex-direction:row;gap:4mm;justify-content:flex-start;height:22mm">${em(W[w][0], 13)}${ops.map((x) => `<span class="word" style="border:1.6px solid var(--c2);border-radius:3mm;padding:1mm 4mm">${esc(x)}</span>`).join("")}</div>`;
    }).join("");
    const lig = r.shuffle(ilustr).slice(0, 5);
    const dir = r.shuffle(lig);
    const ligue = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm 30mm">${lig.map(([w], k) => `<div style="display:flex;align-items:center;justify-content:space-between">${em(W[w][0], 10)}<span style="font-size:18pt">●</span></div><div style="display:flex;align-items:center;gap:3mm"><span style="font-size:18pt">●</span><span class="word">${esc(dir[k][0])}</span></div>`).join("")}</div>`;
    pages.push(page({ mod: "ortografia", tag: "Ortografia", title: `${o.t.replace(/^(\S+)/, "<b>$1</b>")} · pratique`, code: `ORT-${i + 1}B`, body:
      inst(1, "Circule a escrita correta.") + `<div class="grid2">${pares}</div>` +
      inst(2, "Ligue cada figura à palavra certa.") + `<div class="box" style="padding:5mm 6mm">${ligue.replace(/em\(/g, "em(")}</div>` +
      inst(3, "Escreva uma frase com uma das palavras.") + `<div class="write"></div><div class="write"></div>` }));
  });
  return { key: "06-ortografia", nome: "Ortografia", pages };
}

// ------------------------------------------------------------ 7. Leitura e interpretação
const ICO = ["🐱", "🥕", "🌧️", "🎂", "🐦", "🚲", "🧺", "🐶", "🦋", "🍌", "🐟", "🌙", "⚽", "🍲", "🦷", "🐢", "🎨", "🏖️", "📚", "🍰"];
export function leitura() {
  const pages = textos.map((x, i) => page({ mod: "leitura", tag: "Leitura e interpretação", title: `<b>${esc(x.t)}</b>`, code: `LEI-${String(i + 1).padStart(2, "0")}`, body:
    `<div class="box soft" style="display:flex;gap:5mm;align-items:center">${em(ICO[i], 22)}<p style="font-size:15pt;line-height:1.55;font-weight:700">${esc(x.txt)}</p></div>` +
    x.q.map((q, k) => inst(k + 1, esc(q)) + `<div class="write"></div>`).join("") +
    inst(5, "Desenhe a parte da história de que você mais gostou.") + `<div class="box" style="flex:1"></div>` }));
  return { key: "07-leitura-e-interpretacao", nome: "Leitura e interpretação", pages };
}

// ------------------------------------------------------------ 8. Escrita: nome da figura e ligue
export function escrita() {
  const pages = [];
  const r = rng(31);
  const lista = r.shuffle(Object.keys(W).filter((w) => w.length <= 8 && !["zero", "cloro"].includes(w)));
  for (let p = 0; p < 8; p++) {
    const ws = lista.slice(p * 6, p * 6 + 6);
    const cells = ws.map((w) => `<div class="cell" style="gap:3mm">${em(emoji(w), 18)}<div style="display:flex;gap:1.4mm">${[...w].map(() => `<span class="slot" style="min-width:8mm;height:10mm"></span>`).join("")}</div></div>`).join("");
    pages.push(page({ mod: "leitura", tag: "Escrita", title: `Escreva o <b>nome da figura</b> ${p + 1}`, code: `ESC-${p + 1}`, body: inst(1, "Escreva uma letra em cada quadrinho.") + `<div class="grid2" style="flex:1">${cells}</div>` }));
  }
  for (let p = 0; p < 8; p++) {
    const ws = lista.slice(48 + p * 6, 48 + p * 6 + 6);
    const dir = r.shuffle(ws);
    const rows = ws.map((w, k) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:2mm 6mm"><span style="display:flex;align-items:center;gap:6mm">${em(emoji(w), 15)}<span style="font-size:20pt">●</span></span><span style="display:flex;align-items:center;gap:6mm"><span style="font-size:20pt">●</span><span class="word" style="font-size:20pt;width:48mm">${esc(dir[k])}</span></span></div>`).join("");
    pages.push(page({ mod: "leitura", tag: "Escrita", title: `Ligue a figura ao <b>nome</b> ${p + 1}`, code: `LIG-${p + 1}`, body: inst(1, "Leia as palavras e ligue cada figura ao seu nome.") + `<div class="box" style="flex:1;display:flex;flex-direction:column;justify-content:space-around">${rows}</div>` }));
  }
  return { key: "08-escrita", nome: "Escrita: nome da figura e ligue", pages };
}

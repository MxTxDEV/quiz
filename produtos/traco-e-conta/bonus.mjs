// Apostilas bônus do Kit Completo Traço & Conta.
import { page, inst, em, dashed, traceRow, esc, rng } from "./lib.mjs";
import { W } from "./dados.mjs";

// ------------------------------------------------------------ B1. Inglês ilustrado
const ING = [
  ["Colors", "Cores", [["red", "vermelho", "#ef4444"], ["blue", "azul", "#3b82f6"], ["yellow", "amarelo", "#facc15"], ["green", "verde", "#22c55e"], ["orange", "laranja", "#f97316"], ["purple", "roxo", "#a855f7"], ["pink", "rosa", "#ec4899"], ["brown", "marrom", "#92400e"]]],
  ["Numbers", "Números", [["one", "um", "1"], ["two", "dois", "2"], ["three", "três", "3"], ["four", "quatro", "4"], ["five", "cinco", "5"], ["six", "seis", "6"], ["seven", "sete", "7"], ["eight", "oito", "8"]]],
  ["Animals", "Animais", [["dog", "cachorro", "🐶"], ["cat", "gato", "🐱"], ["bird", "pássaro", "🐦"], ["fish", "peixe", "🐟"], ["cow", "vaca", "🐮"], ["pig", "porco", "🐷"], ["horse", "cavalo", "🐴"], ["duck", "pato", "🦆"]]],
  ["Fruits", "Frutas", [["apple", "maçã", "🍎"], ["banana", "banana", "🍌"], ["grapes", "uvas", "🍇"], ["pear", "pera", "🍐"], ["strawberry", "morango", "🍓"], ["lemon", "limão", "🍋"], ["watermelon", "melancia", "🍉"], ["pineapple", "abacaxi", "🍍"]]],
  ["School", "Escola", [["book", "livro", "📕"], ["pencil", "lápis", "✏️"], ["scissors", "tesoura", "✂️"], ["backpack", "mochila", "🎒"], ["ruler", "régua", "📏"], ["crayon", "giz de cera", "🖍️"], ["notebook", "caderno", "📓"], ["computer", "computador", "💻"]]],
  ["Body", "Corpo", [["eye", "olho", "👁️"], ["ear", "orelha", "👂"], ["nose", "nariz", "👃"], ["mouth", "boca", "👄"], ["hand", "mão", "✋"], ["foot", "pé", "🦶"], ["leg", "perna", "🦵"], ["tooth", "dente", "🦷"]]],
  ["Family", "Família", [["mother", "mãe", "👩"], ["father", "pai", "👨"], ["baby", "bebê", "👶"], ["grandma", "avó", "👵"], ["grandpa", "avô", "👴"], ["sister", "irmã", "👧"], ["brother", "irmão", "👦"], ["family", "família", "👪"]]],
  ["Weather", "Tempo", [["sun", "sol", "☀️"], ["rain", "chuva", "🌧️"], ["cloud", "nuvem", "☁️"], ["snow", "neve", "❄️"], ["wind", "vento", "🌬️"], ["rainbow", "arco-íris", "🌈"], ["storm", "tempestade", "⛈️"], ["moon", "lua", "🌙"]]],
  ["Food", "Comida", [["bread", "pão", "🍞"], ["milk", "leite", "🥛"], ["cheese", "queijo", "🧀"], ["egg", "ovo", "🥚"], ["cake", "bolo", "🍰"], ["pizza", "pizza", "🍕"], ["rice", "arroz", "🍚"], ["juice", "suco", "🧃"]]],
  ["Toys", "Brinquedos", [["ball", "bola", "⚽"], ["doll", "boneca", "🪆"], ["kite", "pipa", "🪁"], ["teddy bear", "ursinho", "🧸"], ["car", "carro", "🚗"], ["robot", "robô", "🤖"], ["train", "trem", "🚂"], ["puzzle", "quebra-cabeça", "🧩"]]],
  ["Transport", "Transportes", [["bus", "ônibus", "🚌"], ["plane", "avião", "✈️"], ["boat", "barco", "⛵"], ["bike", "bicicleta", "🚲"], ["truck", "caminhão", "🚚"], ["helicopter", "helicóptero", "🚁"], ["ship", "navio", "🚢"], ["rocket", "foguete", "🚀"]]],
  ["Clothes", "Roupas", [["shirt", "camiseta", "👕"], ["dress", "vestido", "👗"], ["shoes", "tênis", "👟"], ["hat", "chapéu", "👒"], ["socks", "meias", "🧦"], ["pants", "calça", "👖"], ["coat", "casaco", "🧥"], ["cap", "boné", "🧢"]]],
];
export function ingles() {
  const pages = ING.map(([en, pt, items], i) => {
    const cells = items.map(([w, tr, fig]) => {
      const visual = fig.startsWith("#") ? `<svg width="17mm" height="17mm" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" fill="${fig}" stroke="#1e293b" stroke-width=".4"/></svg>` : /^\d$/.test(fig) ? `<span class="big" style="font-size:40pt;color:var(--c1);line-height:1">${fig}</span>` : em(fig, 17);
      return `<div class="cell" style="height:52mm;justify-content:space-between;padding:3mm">${visual}${dashed(w, { size: w.length > 8 ? 9 : 12, w: 80 })}<span style="font-size:10pt;font-weight:800;color:#94a3b8">${esc(tr)}</span></div>`;
    }).join("");
    return page({ mod: "bonus", tag: "Inglês ilustrado", title: `<b>${en}</b> · ${pt}`, code: `ING-${String(i + 1).padStart(2, "0")}`, body: inst(1, "Say the words and trace them! (Fale as palavras e cubra o tracejado.)") + `<div class="grid2" style="flex:1">${cells}</div>` });
  });
  return { key: "B1-ingles-ilustrado", nome: "Inglês ilustrado", pages };
}

// ------------------------------------------------------------ B2. Dinheirinho (sistema monetário)
const nota = (v, cor) => `<svg width="34mm" height="17mm" viewBox="0 0 68 34"><rect x="1" y="1" width="66" height="32" rx="4" fill="${cor}" stroke="#1e293b" stroke-width=".6"/><circle cx="16" cy="17" r="10" fill="#fff" fill-opacity=".6"/><text x="16" y="21" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="11" fill="#1e293b">${v}</text><text x="48" y="22" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="14" fill="#1e293b">R$ ${v}</text></svg>`;
const moeda = (v, label) => `<svg width="15mm" height="15mm" viewBox="0 0 30 30"><circle cx="15" cy="15" r="13.5" fill="#fcd34d" stroke="#92400e" stroke-width="1"/><circle cx="15" cy="15" r="10.5" fill="none" stroke="#b45309" stroke-width=".5"/><text x="15" y="19" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="${label.length > 2 ? 8 : 10}" fill="#78350f">${label}</text></svg>`;
const DIN = { 1: () => moeda(1, "R$1"), 2: () => nota(2, "#93c5fd"), 5: () => nota(5, "#c4b5fd"), 10: () => nota(10, "#fca5a5"), 20: () => nota(20, "#fde68a"), 50: () => nota(50, "#fdba74") };
export function dinheirinho() {
  const pages = [], gab = [];
  const r = rng(77);
  pages.push(page({ mod: "bonus", tag: "Dinheirinho", title: `Conhecendo o <b>dinheiro</b>`, code: "DIN-01", body:
    `<div class="box soft" style="font-size:13pt;font-weight:700">💡 As figuras desta apostila são ilustrações para brincar e aprender. Elas não são cópias do dinheiro de verdade.</div>` +
    inst(1, "Cubra o valor de cada moeda e nota.") +
    `<div class="grid3">${[1, 2, 5, 10, 20, 50].map((v) => `<div class="cell" style="height:42mm">${DIN[v]()}${dashed(`R$ ${v}`, { size: 13, w: 44 })}</div>`).join("")}</div>` +
    inst(2, "Pinte a nota de maior valor e circule a de menor valor.") + `<div class="box" style="display:flex;justify-content:space-around;flex-wrap:wrap;gap:3mm">${r.shuffle([2, 5, 10, 20, 50]).map((v) => DIN[v]()).join("")}</div>` }));
  for (let p = 0; p < 4; p++) {
    const conj = Array.from({ length: 4 }, () => { const n = r.int(2, 4); return Array.from({ length: n }, () => r.pick(p < 2 ? [1, 2, 5] : [1, 2, 5, 10, 20])); });
    const cells = conj.map((c) => `<div class="cell" style="flex-direction:row;justify-content:space-between;height:46mm;padding:3mm 5mm"><div style="display:flex;flex-wrap:wrap;gap:2mm;align-items:center;max-width:120mm">${c.map((v) => DIN[v]()).join("")}</div><span class="big" style="font-size:20pt;white-space:nowrap">R$ <span class="slot" style="min-width:22mm;height:13mm"></span></span></div>`).join("");
    pages.push(page({ mod: "bonus", tag: "Dinheirinho", title: `Quanto <b>dinheiro</b> tem? ${p + 1}`, code: `DIN-${p + 2}`, body: inst(1, "Some as moedas e notas e escreva o total.") + cells }));
    gab.push([`Quanto dinheiro tem? ${p + 1}`, conj.map((c) => `${c.join(" + ")} = R$ ${c.reduce((a, b) => a + b, 0)}`)]);
  }
  const loja = [["🧸", "ursinho", 15], ["🪁", "pipa", 7], ["⚽", "bola", 12], ["🖍️", "giz de cera", 6], ["🍦", "sorvete", 4], ["📕", "livro", 18], ["🧃", "suco", 3], ["🍪", "biscoito", 5], ["🎈", "balão", 2], ["🚗", "carrinho", 9], ["🧩", "quebra-cabeça", 14], ["🍫", "chocolate", 8]];
  for (let p = 0; p < 3; p++) {
    const its = loja.slice(p * 4, p * 4 + 4);
    const cells = its.map(([e, n, v]) => `<div class="cell" style="flex-direction:row;justify-content:space-between;height:44mm;padding:3mm 5mm"><div style="display:flex;align-items:center;gap:4mm">${em(e, 16)}<div><div class="word">${esc(n)}</div><div class="big" style="font-size:22pt;color:var(--c1)">R$ ${v},00</div></div></div><div style="display:flex;gap:1.5mm;flex-wrap:wrap;max-width:80mm;justify-content:flex-end">${[10, 5, 2, 1, 1].map((x) => DIN[x]()).join("")}</div></div>`).join("");
    pages.push(page({ mod: "bonus", tag: "Dinheirinho", title: `Vamos às <b>compras</b> ${p + 1}`, code: `DIN-${p + 6}`, body: inst(1, "Pinte as notas e moedas que você usaria para pagar o valor exato.") + cells }));
    gab.push([`Vamos às compras ${p + 1}`, its.map(([, n, v]) => `${n}: R$ ${v},00 (várias combinações possíveis)`)]);
  }
  const trocos = [[10, 7], [5, 3], [20, 12], [10, 4], [20, 15], [50, 35]];
  pages.push(page({ mod: "bonus", tag: "Dinheirinho", title: `Quanto <b>sobra</b>?`, code: "DIN-09", body: inst(1, "Você pagou com a nota. Quanto recebe de troco?") + trocos.map(([pg, pr]) => `<div class="cell" style="flex-direction:row;justify-content:space-between;height:31mm;padding:3mm 6mm">${DIN[pg]()}<span class="word" style="font-size:16pt">compra de <b>R$ ${pr},00</b></span><span class="big" style="font-size:18pt">troco: R$ <span class="slot"></span></span></div>`).join("") }));
  gab.push(["Quanto sobra?", trocos.map(([a, b]) => `R$ ${a} − R$ ${b} = R$ ${a - b}`)]);
  pages.push(page({ mod: "bonus", tag: "Dinheirinho", title: `Meu <b>cofrinho</b>`, code: "DIN-10", body: inst(1, "Desenhe as moedas que você quer guardar e anote quanto já juntou.") + `<div class="box soft" style="display:grid;place-items:center;height:110mm">${em("🐷", 50)}</div>` + inst(2, "Eu quero juntar dinheiro para:") + `<div class="write"></div>` + inst(3, "Semana a semana:") + `<div class="grid4">${["1ª semana", "2ª semana", "3ª semana", "4ª semana"].map((s) => `<div class="cell" style="height:30mm"><b>${s}</b>R$ ______</div>`).join("")}</div>` }));
  return { key: "B2-dinheirinho", nome: "Dinheirinho: sistema monetário", pages, gab };
}

// ------------------------------------------------------------ B3. Horas e calendário
const relogio = (h, m, ponteiros = true, size = 46) => {
  const marks = Array.from({ length: 12 }, (_, i) => { const a = ((i + 1) / 12) * Math.PI * 2; return `<text x="${50 + Math.sin(a) * 36}" y="${50 - Math.cos(a) * 36 + 4}" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="11" fill="#1e293b">${i + 1}</text>`; }).join("");
  const ha = ((h % 12) + m / 60) / 12 * Math.PI * 2, ma = (m / 60) * Math.PI * 2;
  const hands = ponteiros ? `<line x1="50" y1="50" x2="${50 + Math.sin(ha) * 20}" y2="${50 - Math.cos(ha) * 20}" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/><line x1="50" y1="50" x2="${50 + Math.sin(ma) * 30}" y2="${50 - Math.cos(ma) * 30}" stroke="var(--c1)" stroke-width="2.6" stroke-linecap="round"/>` : "";
  return `<svg viewBox="0 0 100 100" width="${size}mm" height="${size}mm"><circle cx="50" cy="50" r="47" fill="#fff" stroke="var(--c1)" stroke-width="3"/>${marks}${hands}<circle cx="50" cy="50" r="3" fill="#1e293b"/></svg>`;
};
export function horas() {
  const pages = [], gab = [];
  const r = rng(91);
  pages.push(page({ mod: "bonus", tag: "Horas", title: `Conhecendo o <b>relógio</b>`, code: "HOR-01", body: `<div class="box soft" style="display:flex;align-items:center;gap:6mm">${relogio(3, 0, true, 80)}<div style="font-size:14pt;font-weight:700;line-height:1.6">O ponteiro <b>pequeno</b> (preto) mostra a <b>hora</b>.<br>O ponteiro <b>grande</b> (colorido) mostra os <b>minutos</b>.<br>Quando o ponteiro grande está no <b>12</b>, é hora cheia.<br>Quando está no <b>6</b>, é <b>meia hora</b> (30 minutos).</div></div>` + inst(1, "Cubra os números do relógio.") + `<div class="box" style="display:flex;justify-content:space-around">${Array.from({ length: 12 }, (_, i) => dashed(String(i + 1), { size: 16, w: 13 })).join("")}</div>` + inst(2, "Desenhe o que você faz às 8 horas da manhã.") + `<div class="box" style="flex:1"></div>` }));
  for (let p = 0; p < 3; p++) {
    const hs = Array.from({ length: 6 }, () => [r.int(1, 12), p === 0 ? 0 : r.pick([0, 30])]);
    pages.push(page({ mod: "bonus", tag: "Horas", title: `Que horas <b>são</b>? ${p + 1}`, code: `HOR-${p + 2}`, body: inst(1, "Escreva a hora que cada relógio mostra.") + `<div class="grid3" style="flex:1">${hs.map(([h, m]) => `<div class="cell">${relogio(h, m)}<span class="big" style="font-size:18pt"><span class="slot"></span> : <span class="slot"></span></span></div>`).join("")}</div>` }));
    gab.push([`Que horas são? ${p + 1}`, hs.map(([h, m]) => `${h}:${m ? "30" : "00"}`)]);
  }
  for (let p = 0; p < 2; p++) {
    const hs = Array.from({ length: 6 }, () => [r.int(1, 12), p === 0 ? 0 : r.pick([0, 30])]);
    pages.push(page({ mod: "bonus", tag: "Horas", title: `Desenhe os <b>ponteiros</b> ${p + 1}`, code: `HOR-${p + 5}`, body: inst(1, "Desenhe os ponteiros para mostrar a hora escrita.") + `<div class="grid3" style="flex:1">${hs.map(([h, m]) => `<div class="cell">${relogio(h, m, false)}<span class="big" style="font-size:22pt">${h}:${m ? "30" : "00"}</span></div>`).join("")}</div>` }));
  }
  const dias = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  pages.push(page({ mod: "bonus", tag: "Calendário", title: `Dias da <b>semana</b>`, code: "HOR-07", body: inst(1, "Cubra os dias da semana.") + dias.map((d) => `<div style="display:flex;align-items:center;gap:4mm;border-bottom:1.5px solid #cbd5e1;padding:1mm 0">${dashed(d, { size: 13, w: 90 })}<span style="flex:1"></span></div>`).join("") + inst(2, "Em que dia da semana você vai à escola? E em que dia você descansa?") + `<div class="write"></div><div class="write"></div>` }));
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  pages.push(page({ mod: "bonus", tag: "Calendário", title: `Meses do <b>ano</b>`, code: "HOR-08", body: inst(1, "Cubra os meses do ano.") + `<div class="grid2">${meses.map((m, i) => `<div class="cell" style="flex-direction:row;justify-content:flex-start;gap:3mm;height:21mm"><span class="big" style="color:var(--c1);font-size:16pt;width:9mm">${i + 1}</span>${dashed(m, { size: 12, w: 62 })}</div>`).join("")}</div>` + inst(2, "Em que mês é o seu aniversário? Pinte-o acima e escreva aqui.") + `<div class="write"></div>` }));
  return { key: "B3-horas-e-calendario", nome: "Horas e calendário", pages, gab };
}

// ------------------------------------------------------------ B4. Sondagem de escrita
const SOND = [
  ["Animais", ["borboleta", "cavalo", "gato", "boi"], "O gato bebe leite."], ["Frutas", ["melancia", "banana", "uva", "noz"], "A banana é amarela."],
  ["Material escolar", ["apontador", "caderno", "lápis", "giz"], "A menina usa o lápis."], ["Brinquedos", ["bicicleta", "boneca", "bola", "trem"], "O menino brinca com a bola."],
];
export function sondagem() {
  const pages = [];
  pages.push(page({ mod: "bonus", tag: "Sondagem · para o professor", title: `Como aplicar a <b>sondagem</b>`, code: "SON-00", head: false, body: `<div style="font-size:12pt;line-height:1.55;display:flex;flex-direction:column;gap:3mm">
    <div class="box soft"><b>Para que serve:</b> acompanhar como a criança pensa a escrita ao longo do ano e planejar intervenções. A sondagem não é prova e não vale nota.</div>
    <div class="box"><b>Como aplicar</b><ol style="padding-left:6mm;margin-top:2mm"><li>Faça individualmente ou em pequenos grupos, em um momento tranquilo.</li><li>Dite as palavras do mesmo campo semântico, na ordem: polissílaba, trissílaba, dissílaba e monossílaba. Depois dite a frase.</li><li>Fale a palavra normalmente, sem separar as sílabas.</li><li>Peça para a criança ler o que escreveu, apontando com o dedo. Anote como ela lê.</li><li>Não corrija na hora. Registre a data e guarde a folha para comparar.</li></ol></div>
    <div class="box"><b>Hipóteses de escrita (referência para a observação)</b><ul style="padding-left:6mm;margin-top:2mm"><li><b>Pré-silábica:</b> usa desenhos, rabiscos ou letras sem relação com os sons.</li><li><b>Silábica sem valor sonoro:</b> uma letra para cada sílaba, sem relação com o som.</li><li><b>Silábica com valor sonoro:</b> uma letra para cada sílaba, com relação com o som (ex.: AO para gato).</li><li><b>Silábico-alfabética:</b> às vezes escreve a sílaba completa, às vezes uma letra só.</li><li><b>Alfabética:</b> escreve todas as letras dos sons, ainda que com erros de ortografia.</li></ul></div>
    <div class="box"><b>Ditados sugeridos</b> (um por bimestre):<br>${SOND.map(([c, ws, f]) => `<b>${c}:</b> ${ws.join(", ")} · <i>${f}</i>`).join("<br>")}</div>
    <div style="font-size:9.5pt;color:#64748b">As hipóteses seguem a descrição clássica da psicogênese da língua escrita. Use como apoio à observação; cada criança tem seu ritmo.</div></div>` }));
  SOND.forEach(([campo], i) => {
    pages.push(page({ mod: "bonus", tag: "Sondagem", title: `Sondagem de escrita · <b>${i + 1}º bimestre</b>`, code: `SON-${i + 1}`, body: `<div class="box soft" style="font-size:12pt;font-weight:700">Escreva as palavras que a professora vai ditar. (Campo: ${campo})</div>` + [1, 2, 3, 4].map((n) => inst(n, "") + `<div class="write"></div>`).join("") + inst(5, "Frase:") + `<div class="write"></div><div class="write"></div>` + `<div class="box" style="margin-top:auto;font-size:10pt;color:#64748b">Para o professor · leitura da criança e observações:<div class="line"></div><div class="line"></div></div>` }));
  });
  pages.push(page({ mod: "bonus", tag: "Sondagem · para o professor", title: `Registro da <b>turma</b>`, code: "SON-R", head: false, body: `<div class="head" style="margin-bottom:2mm"><span>Turma:</span><span class="d">Ano: ________</span></div><table style="width:100%;border-collapse:collapse;font-size:10pt">${`<tr>${["Nº", "Nome", "1º bim.", "2º bim.", "3º bim.", "4º bim."].map((h) => `<th style="background:var(--c1);color:#fff;padding:2mm;border:1px solid #cbd5e1">${h}</th>`).join("")}</tr>` + Array.from({ length: 28 }, (_, i) => `<tr>${["" + (i + 1), "", "", "", "", ""].map((c, k) => `<td style="border:1px solid #cbd5e1;height:8.2mm;padding:0 2mm;${k === 1 ? "width:70mm" : ""}">${c}</td>`).join("")}</tr>`).join("")}</table><div style="font-size:9pt;color:#64748b">Legenda: PS pré-silábica · SSV silábica sem valor · SCV silábica com valor · SA silábico-alfabética · A alfabética</div>` }));
  return { key: "B4-sondagem-de-escrita", nome: "Sondagem de escrita", pages };
}

// ------------------------------------------------------------ B5. Parede da sala e certificados
const ALFA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PAREDE = { A: "abelha", B: "bola", C: "cavalo", D: "dado", E: "elefante", F: "foca", G: "gato", H: "hipopótamo", I: "igreja", J: "jacaré", K: "kiwi", L: "leão", M: "macaco", N: "navio", O: "ovo", P: "pato", Q: "queijo", R: "rato", S: "sapo", T: "tartaruga", U: "uva", V: "vaca", W: "kiwi", X: "xícara", Y: null, Z: "zebra" };
const CORES = ["#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899"];
export function parede() {
  const pages = [];
  for (let p = 0; p < 7; p++) {
    const ls = ALFA.slice(p * 4, p * 4 + 4);
    const cards = ls.map((L, i) => { const w = PAREDE[L]; const c = CORES[(p * 4 + i) % CORES.length]; return `<div style="border:2.2mm solid ${c};border-radius:6mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm"><span style="font-family:Fredoka;font-weight:700;font-size:62pt;color:${c};line-height:1">${L}${L.toLowerCase()}</span>${w ? em(W[w][0], 26) : `<span style="font-size:13pt;font-weight:800;color:#64748b">Yasmin · Yuri</span>`}<span class="word" style="font-size:18pt">${w ? (L === "W" ? "kiwi (w de waffle)" : w) : ""}</span></div>`; }).join("");
    pages.push(page({ mod: "bonus", tag: "Parede da sala", title: `Alfabeto ilustrado <b>${p + 1}/7</b>`, code: `PAR-A${p + 1}`, head: false, body: `<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:5mm;flex:1">${cards}</div>` }));
  }
  const objs = ["", "🍎", "⭐", "🐟", "🌸", "🚗", "🐞", "🎈", "🍓", "🐤", "⚽"];
  for (let p = 0; p < 3; p++) {
    const ns = [0, 1, 2, 3].map((k) => p * 4 + k).filter((n) => n <= 10);
    const cards = ns.map((n) => { const c = CORES[n % CORES.length]; return `<div style="border:2.2mm solid ${c};border-radius:6mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2mm;padding:3mm"><span style="font-family:Fredoka;font-weight:700;font-size:70pt;color:${c};line-height:1">${n}</span><div style="display:flex;flex-wrap:wrap;gap:1mm;justify-content:center;max-width:70mm">${n ? Array.from({ length: n }, () => em(objs[n], n <= 3 ? 20 : n <= 6 ? 13 : 10)).join("") : `<span style="font-weight:800;color:#64748b">nenhum</span>`}</div><span class="word" style="font-size:18pt">${["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"][n]}</span></div>`; }).join("");
    pages.push(page({ mod: "bonus", tag: "Parede da sala", title: `Números ilustrados <b>${p + 1}/3</b>`, code: `PAR-N${p + 1}`, head: false, body: `<div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:5mm;flex:1">${cards}</div>` }));
  }
  const certs = [["🏅", "Certificado de Leitor", "por ter lido com dedicação e alegria"], ["🔤", "Mestre do Alfabeto", "por conhecer todas as letras do alfabeto"], ["🔢", "Craque da Matemática", "pelo empenho nas continhas e nos desafios"], ["🌟", "Estrela da Turma", "pelo esforço, pela dedicação e pela gentileza"]];
  certs.forEach(([e, t, por], i) => {
    pages.push(page({ mod: "bonus", tag: "Certificado", title: `<b>${t}</b>`, code: `CER-${i + 1}`, head: false, body: `<div style="flex:1;border:3mm double var(--c1);border-radius:8mm;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7mm;text-align:center;padding:10mm">${em(e, 40)}<div style="font-family:Fredoka;font-weight:700;font-size:34pt;color:var(--c1)">${t}</div><div style="font-size:15pt;font-weight:700">Este certificado é concedido a</div><div style="border-bottom:2px solid #1e293b;width:150mm;height:14mm"></div><div style="font-size:15pt;font-weight:700">${por}.</div><div style="display:flex;gap:20mm;margin-top:10mm;font-size:12pt;font-weight:800;color:#64748b"><div style="border-top:1.5px solid #64748b;width:60mm;padding-top:2mm">Professor(a) / Responsável</div><div style="border-top:1.5px solid #64748b;width:45mm;padding-top:2mm">Data</div></div></div>` }));
  });
  return { key: "B5-parede-e-certificados", nome: "Parede da sala e certificados", pages };
}

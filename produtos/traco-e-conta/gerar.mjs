// Gera o kit Traço & Conta: PDFs por módulo, gabarito, apostilas bônus e as áreas de acesso.
// Uso: node produtos/traco-e-conta/gerar.mjs
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync, copyFileSync, existsSync, statSync } from "node:fs";
import path from "node:path";
import * as L from "./modulos-letras.mjs";
import * as M from "./modulos-mat.mjs";
import * as B from "./bonus.mjs";
import { doc, page, esc } from "./lib.mjs";

const { chromium } = createRequire(import.meta.url)("playwright");
const here = path.dirname(new URL(import.meta.url).pathname);
const pub = path.join(here, "..", "..", "public", "acesso");

/** pastas com caminho não adivinhável: o link é entregue só a quem comprou */
export const PASTAS = { basico: "traco-e-conta-basico-r7m2k9wq", bonus: "traco-e-conta-bonus-x4p8n3vd", completo: "traco-e-conta-completo-h6t9c2ja" };

const basico = [L.motora(), L.alfabeto(), L.silabas(), L.separar(), L.complexas(), L.ortografia(), L.leitura(), L.escrita(), M.numeros(), M.quantidades(), M.contas(), M.logica(), M.formas(), M.labirintos(), M.caca(), M.desenho()];
const bonus = [B.ingles(), B.dinheirinho(), B.horas(), B.sondagem(), B.parede()];

function gabarito(mods, titulo, code) {
  const blocos = [];
  for (const m of mods) for (const [t, linhas] of m.gab ?? []) blocos.push(`<div class="box" style="break-inside:avoid"><b style="font-family:Fredoka;color:var(--c1)">${esc(t)}</b><div style="font-size:9.5pt;line-height:1.45;margin-top:1mm">${linhas.map(esc).join("<br>")}</div></div>`);
  const pages = [];
  for (let i = 0; i < blocos.length; i += 9) pages.push(page({ mod: "bonus", tag: "Gabarito", title: `${titulo} <b>${pages.length + 1}</b>`, code: `${code}-${pages.length + 1}`, head: false, body: `<div style="columns:3;column-gap:4mm;flex:1">${blocos.slice(i, i + 9).join("")}</div>` }));
  const caca = mods.flatMap((m) => m.gabHtml ?? []);
  for (let i = 0; i < caca.length; i += 6) pages.push(page({ mod: "caca", tag: "Gabarito", title: `Caça-palavras <b>${Math.floor(i / 6) + 1}</b>`, code: `${code}-C${Math.floor(i / 6) + 1}`, head: false, body: `<div class="grid2" style="flex:1">${caca.slice(i, i + 6).join("")}</div>` }));
  return pages;
}

const browser = await chromium.launch();
const pg = await browser.newPage();
async function pdf(pages, file, title) {
  await pg.setContent(doc(pages, title), { waitUntil: "load" });
  await pg.evaluate(() => document.fonts.ready);
  await pg.pdf({ path: file, format: "A4", printBackground: true, preferCSSPageSize: true });
  return { pages: pages.length, mb: statSync(file).size / 1e6 };
}

const nomeArq = (m) => `${m.key}.pdf`;
const out = {};
for (const [k, dir] of Object.entries(PASTAS)) { const d = path.join(pub, dir); if (existsSync(d)) rmSync(d, { recursive: true }); mkdirSync(d, { recursive: true }); out[k] = d; }

const lista = { basico: [], bonus: [] };
let total = 0;
for (const m of basico) {
  const r = await pdf(m.pages, path.join(out.basico, nomeArq(m)), m.nome);
  lista.basico.push({ arq: nomeArq(m), nome: m.nome, pages: r.pages });
  total += r.pages;
  console.log(`  ${m.nome}: ${r.pages} páginas (${r.mb.toFixed(1)} MB)`);
}
const gb = gabarito(basico, "Gabarito", "GAB");
await pdf(gb, path.join(out.basico, "99-gabarito.pdf"), "Gabarito");
lista.basico.push({ arq: "99-gabarito.pdf", nome: "Gabarito (respostas)", pages: gb.length, extra: true });
let totalBonus = 0;
for (const m of bonus) {
  const r = await pdf(m.pages, path.join(out.bonus, nomeArq(m)), m.nome);
  lista.bonus.push({ arq: nomeArq(m), nome: m.nome, pages: r.pages });
  totalBonus += r.pages;
  console.log(`  [bônus] ${m.nome}: ${r.pages} páginas (${r.mb.toFixed(1)} MB)`);
}
const gbb = gabarito(bonus, "Gabarito dos bônus", "GBB");
await pdf(gbb, path.join(out.bonus, "99-gabarito-bonus.pdf"), "Gabarito dos bônus");
lista.bonus.push({ arq: "99-gabarito-bonus.pdf", nome: "Gabarito dos bônus", pages: gbb.length, extra: true });
await browser.close();

// ---------------------------------------------------------------- áreas de acesso
for (const d of Object.values(out)) for (const f of ["fredoka-latin-600-normal.woff2", "nunito-latin-700-normal.woff2", "nunito-latin-800-normal.woff2"]) copyFileSync(path.join(here, "fontes", f), path.join(d, f));
const card = (it, base) => `<a class="item${it.extra ? " extra" : ""}" href="/acesso/${base}/${it.arq}" download><span class="n">${esc(it.nome)}</span><span class="p">${it.pages} ${it.extra ? "páginas" : "atividades"}</span><span class="b">Baixar PDF</span></a>`;
const acesso = ({ titulo, sub, grupos }) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${esc(titulo)} · Traço & Conta</title><style>
@font-face{font-family:Fredoka;font-weight:600;src:url(fredoka-latin-600-normal.woff2)}@font-face{font-family:Nunito;font-weight:700;src:url(nunito-latin-700-normal.woff2)}@font-face{font-family:Nunito;font-weight:800;src:url(nunito-latin-800-normal.woff2)}
*{box-sizing:border-box;margin:0}body{font-family:Nunito,sans-serif;font-weight:700;background:#fffbeb;color:#1e293b}
.wrap{max-width:860px;margin:0 auto;padding:28px 18px 60px}.logo{font-family:Fredoka;font-size:26px;color:#2563eb}.logo span{color:#f97316}
h1{font-family:Fredoka;font-size:clamp(28px,6vw,42px);line-height:1.1;margin:22px 0 8px}p.sub{color:#475569;line-height:1.6;max-width:640px}
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.step{background:#fff;border:2px dashed #fcd34d;border-radius:16px;padding:14px;font-size:15px}.step b{display:block;font-family:Fredoka;color:#f97316;font-size:18px}
h2{font-family:Fredoka;font-size:22px;margin:28px 0 12px}.list{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.item{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center;background:#fff;border:2px solid #e2e8f0;border-radius:16px;padding:14px 16px;text-decoration:none;color:inherit}
.item:hover{border-color:#2563eb}.item .n{font-family:Fredoka;font-size:17px}.item .p{grid-column:1;color:#64748b;font-size:13px}.item .b{grid-row:1/3;grid-column:2;background:#16a34a;color:#fff;border-radius:12px;padding:10px 12px;font-size:13px;font-weight:800}
.item.extra{background:#f8fafc}.dica{margin-top:28px;background:#fff;border-radius:16px;padding:16px;border:2px solid #bfdbfe;line-height:1.6;font-size:15px}
.legal{margin-top:30px;color:#94a3b8;font-size:13px;line-height:1.6}@media(max-width:640px){.steps,.list{grid-template-columns:1fr}}
</style></head><body><div class="wrap"><div class="logo">Traço <span>&amp;</span> Conta</div><h1>${esc(titulo)}</h1><p class="sub">${esc(sub)}</p>
<div class="steps"><div class="step"><b>1 · Baixe</b>Toque em "Baixar PDF" no módulo que quiser usar.</div><div class="step"><b>2 · Imprima</b>Folha A4, colorida ou em preto e branco.</div><div class="step"><b>3 · Aplique</b>Siga a ordem dos módulos ou escolha pelo tema da semana.</div></div>
${grupos.map(([t, its, base]) => `<h2>${esc(t)}</h2><div class="list">${its.map((it) => card(it, base)).join("")}</div>`).join("")}
<div class="dica"><b>Dica de impressão:</b> imprima em "Tamanho real" ou "Ajustar à página". Para economizar tinta, as folhas também ficam boas em preto e branco. Você pode imprimir quantas vezes precisar, para uso com seus filhos ou alunos.</div>
<p class="legal">Material para uso pessoal e em sala de aula. Não é permitido revender ou distribuir os arquivos. Este link é pessoal: não compartilhe.</p></div></body></html>`;

writeFileSync(path.join(out.basico, "index.html"), acesso({ titulo: "Seu Kit Básico chegou!", sub: `São ${total} atividades em ${basico.length} módulos, mais o gabarito. Tudo pronto para imprimir.`, grupos: [["Módulos do Kit Básico", lista.basico, PASTAS.basico]] }));
writeFileSync(path.join(out.bonus, "index.html"), acesso({ titulo: "Suas 5 apostilas bônus chegaram!", sub: `São ${totalBonus} páginas extras: inglês, dinheirinho, horas, sondagem e material de parede.`, grupos: [["Apostilas bônus", lista.bonus, PASTAS.bonus]] }));
writeFileSync(path.join(out.completo, "index.html"), acesso({ titulo: "Seu Kit Completo chegou!", sub: `São ${total} atividades do Kit Básico e mais ${totalBonus} páginas das 5 apostilas bônus. Tudo pronto para imprimir.`, grupos: [["Kit Básico", lista.basico, PASTAS.basico], ["Apostilas bônus", lista.bonus, PASTAS.bonus]] }));
writeFileSync(path.join(here, "contagem.json"), JSON.stringify({ atividades: total, modulos: basico.map((m) => [m.nome, m.pages.length]), bonusPaginas: totalBonus, bonus: bonus.map((m) => [m.nome, m.pages.length]) }, null, 2));
console.log(`\nKit Básico: ${total} atividades · Bônus: ${totalBonus} páginas`);

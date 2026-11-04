// Prévia: renderiza páginas escolhidas em PNG. Uso: node previa.mjs <modulo> <indices...>
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import * as L from "./modulos-letras.mjs";
import { doc } from "./lib.mjs";
const { chromium } = createRequire(import.meta.url)("playwright");
const out = process.env.OUT || "/tmp";
const mods = { ...L };
let M; try { M = await import("./modulos-mat.mjs"); Object.assign(mods, M); } catch {}
let B; try { B = await import("./bonus.mjs"); Object.assign(mods, B); } catch {}
const [name, ...idx] = process.argv.slice(2);
const mod = mods[name]();
console.log(mod.nome, mod.pages.length, "páginas");
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
for (const i of idx.map(Number)) {
  await p.setContent(doc([mod.pages[i]], "x")); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(100);
  await p.locator(".page").first().screenshot({ path: `${out}/${name}-${i}.png` });
}
await b.close();

// Teste de ponta a ponta do funil (celular): quiz → resultado → página de vendas → clique de compra.
// Verifica eventos do Pixel (sem duplicar, inclusive com o Pixel carregando atrasado), personalização e UTMs.
// Uso: node e2e/funil.mjs <baseURL> <slug> [pasta-de-prints]
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
const [base = "http://localhost:3100", slug = "fx-demo", shots] = process.argv.slice(2);

const PERFIS = [
  { nome: "sem investir + internet", resp: ["Até R$ 500", "Até 1 hora", "Quero começar sem investir", "Trabalhar pela internet", "Não sei como conseguir clientes", "Pela internet", "Não, estou começando do zero"], perfil: "Prestador de serviços digitais" },
  { nome: "vender na região com capital", resp: ["De R$ 1.000 a R$ 2.000", "Mais de 3 horas", "De R$ 50 a R$ 300", "Vender produtos", "Não sei por onde começar", "Na minha cidade ou região", "Sim, já tive alguma experiência"], perfil: "Empreendedor do bairro" },
  { nome: "indeciso sem dinheiro", resp: ["Até R$ 500", "De 1 a 3 horas", "Até R$ 50", "Ainda não sei. Quero descobrir.", "Tenho pouco dinheiro", "Tanto faz. Quero a melhor oportunidade.", "Não, estou começando do zero"], perfil: "Iniciante com pouco capital" },
];

const b = await chromium.launch();
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); console.log(cond ? "  ✓" : "  ✗", msg); };

for (const [i, caso] of PERFIS.entries()) {
  console.log(`\n▶ ${caso.nome}`);
  const ctx = await b.newContext({ ...devices["iPhone 13"] });
  // Pixel "atrasado": fbq só aparece 1,5 s depois (simula o script do Meta carregando devagar)
  await ctx.addInitScript(() => {
    window.__fbq = [];
    setTimeout(() => { window.fbq = (...a) => window.__fbq.push(a); }, 1500);
  });
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(e.message));
  await p.route("**/api/public/checkout**", (r) => r.fulfill({ status: 200, body: "checkout interceptado" }));
  await p.goto(`${base}/q/${slug}?utm_source=facebook&utm_medium=cpc&utm_campaign=teste&utm_content=F-comercial`, { waitUntil: "networkidle" });
  ok(await p.getByText("Você quer ganhar dinheiro extra").count() > 0, "abertura com a nova headline");
  if (i === 0 && shots) await p.screenshot({ path: `${shots}/e2e-intro.png` });
  await p.getByRole("button", { name: /descobrir meu caminho/i }).click();
  for (const r of caso.resp) {
    await p.getByRole("radio", { name: r, exact: true }).first().click();
    await p.waitForTimeout(450);
  }
  await p.getByText("Análise concluída", { exact: false }).first().waitFor({ timeout: 15000 });
  await p.waitForTimeout(1600); // deixa o Pixel atrasado aparecer
  const perfil = await p.locator("h1").first().textContent();
  ok(perfil?.trim() === caso.perfil, `perfil coerente: ${perfil?.trim()}`);
  ok(await p.getByText("Por que esse perfil combina com você").count() === 1, "justificativas exibidas");
  ok(await p.getByText("1º passo:").count() === 3, "3 caminhos com primeiro passo");
  if (shots) await p.screenshot({ path: `${shots}/e2e-resultado-${i}.png`, fullPage: true });
  await p.getByRole("link", { name: /quero conhecer meu plano de ação/i }).click();
  await p.waitForURL(/\/oferta\?s=/, { timeout: 20000 });
  await p.waitForLoadState("load");
  await p.waitForTimeout(1800);
  ok(await p.getByText("Analisamos suas respostas").count() > 0, "página de vendas personalizada com as respostas");
  ok(await p.locator('img[alt^="Trecho do material"]').count() === 5, "5 prévias reais do material");
  await p.locator("[data-offer]").scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
  const buy = p.locator("a[data-purchase]").first();
  const href = await buy.getAttribute("href");
  await buy.click();
  await p.waitForURL(/api\/public\/checkout/, { timeout: 5000 }).catch(() => {});
  const evs = await p.evaluate(() => window.__fbq).catch(() => null);
  // os eventos da página de vendas ficaram no contexto anterior; conferimos os do quiz pelo histórico salvo abaixo
  ok(/\/api\/public\/checkout\?s=[0-9a-f-]{36}&b=/.test(href || ""), "botão de compra passa pela rota de checkout com sessão e bloco");
  // redirecionamento real (sem seguir para a Kiwify): confere UTMs e sck
  const res = await fetch(new URL(href, base), { redirect: "manual" });
  const loc = res.headers.get("location") || "";
  const u = loc ? new URL(loc) : null;
  ok(res.status >= 300 && res.status < 400 && u?.host === "pay.kiwify.com.br", "redireciona para o checkout da Kiwify");
  ok(u?.searchParams.get("utm_source") === "facebook" && u?.searchParams.get("utm_content") === "F-comercial", "UTMs do anúncio preservadas até o checkout");
  ok(/^[0-9a-f-]{36}$/.test(u?.searchParams.get("sck") || ""), "sck = sessão (para a Kiwify devolver no webhook e atribuir a venda)");
  await ctx.close();
  console.log("  (redirecionamento)", loc.replace(/sck=[^&]+/, "sck=…").slice(0, 170));
  if (errs.length) falhas.push(`erros na página: ${errs.join(" | ")}`);
}

// eventos do Pixel: roda o fluxo mais uma vez gravando o fbq em sessionStorage a cada página
console.log("\n▶ eventos do Pixel");
const ctx = await b.newContext({ ...devices["iPhone 13"] });
await ctx.addInitScript(() => {
  const log = JSON.parse(sessionStorage.getItem("__ev") || "[]");
  setTimeout(() => {
    window.fbq = (...a) => { log.push(a.slice(0, 2).join(":")); sessionStorage.setItem("__ev", JSON.stringify(log)); };
  }, 1500);
});
const p = await ctx.newPage();
await p.route("**/api/public/checkout**", (r) => r.fulfill({ status: 200, body: "ok" }));
await p.goto(`${base}/q/${slug}`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: /descobrir meu caminho/i }).click();
await p.getByRole("button", { name: /descobrir meu caminho/i }).click().catch(() => {}); // clique duplo não pode duplicar
for (const r of PERFIS[0].resp) { await p.getByRole("radio", { name: r, exact: true }).first().click(); await p.waitForTimeout(400); }
await p.getByText("Análise concluída").first().waitFor({ timeout: 15000 });
await p.waitForTimeout(1700);
await p.getByRole("link", { name: /quero conhecer meu plano de ação/i }).click();
await p.waitForURL(/\/oferta\?s=/); await p.waitForLoadState("load"); await p.waitForTimeout(1900);
await p.locator("[data-offer]").scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
const buy = p.locator("a[data-purchase]").first();
await buy.click(); await p.waitForTimeout(150);
await buy.click({ timeout: 2000 }).catch(() => {}); // segundo clique não pode duplicar InitiateCheckout
await p.waitForURL(/api\/public\/checkout/, { timeout: 5000 }).catch(() => {});
const log = await p.evaluate(() => JSON.parse(sessionStorage.getItem("__ev") || "[]"));
const n = (e) => log.filter((x) => x === e).length;
console.log("  eventos:", log.join(", "));
ok(n("trackCustom:StartQuiz") === 1, "StartQuiz exatamente 1 vez (mesmo com Pixel atrasado e clique duplo)");
ok(n("track:CompleteRegistration") === 1, "CompleteRegistration exatamente 1 vez");
ok(n("track:ViewContent") === 1, "ViewContent 1 vez na página de vendas");
ok(n("trackCustom:ViewOffer") === 1, "ViewOffer 1 vez ao ver a oferta");
ok(n("track:InitiateCheckout") === 1, "InitiateCheckout exatamente 1 vez (mesmo com 2 cliques)");
ok(n("track:Purchase") === 0, "nenhum Purchase disparado pelo site (só a Kiwify confirma venda)");
await b.close();
console.log(falhas.length ? `\n${falhas.length} FALHA(S):\n- ${falhas.join("\n- ")}` : "\nTUDO OK");
process.exit(falhas.length ? 1 : 0);

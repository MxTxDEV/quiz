// Teste de ponta a ponta do funil (celular): quiz → resultado → página de vendas → clique de compra.
// Verifica eventos do Pixel (sem duplicar, inclusive com o Pixel carregando atrasado), personalização e UTMs.
// Uso: node e2e/funil.mjs <baseURL> <slug> [pasta-de-prints]
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
const [base = "http://localhost:3100", slug = "fx-demo", shots] = process.argv.slice(2);

const PERFIS = [
  { nome: "sem dinheiro + serviços", resp: ["Meu dinheiro acaba antes do fim do mês.", "Não tenho dinheiro para investir.", "Não conseguir realizar meus planos.", "Até R$ 500 por mês.", "Quitar minhas dívidas.", "Prestar serviços.", "De 1 a 3 horas."], perfil: "Iniciante com pouco investimento" },
  { nome: "vendas com tempo", resp: ["Preciso encontrar uma nova fonte de renda.", "Não sei como encontrar clientes.", "Não conseguir realizar meus planos.", "De R$ 500 a R$ 1.000.", "Ter dinheiro para realizar meus planos.", "Vender produtos sem precisar manter estoque.", "Mais de 3 horas."], perfil: "Perfil comercial e de vendas" },
  { nome: "pouco tempo", resp: ["Consigo pagar minhas contas, mas sobra pouco.", "Não tenho tempo disponível.", "Trabalhar muito e continuar sem dinheiro.", "Até R$ 500 por mês.", "Ter mais tranquilidade financeira.", "Trabalhar pela internet.", "Até 1 hora."], perfil: "Pouco tempo disponível" },
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
  for (const [k, r] of caso.resp.entries()) {
    if (k === 0) ok(await p.getByText("Etapa 1 de 4 — Conhecendo você").count() === 1, "etapa 1 de 4 visível");
    if (k === 5) ok(await p.getByText("Etapa 4 de 4 — Encontrando seu caminho").count() === 1, "etapa 4 de 4 visível");
    await p.getByRole("radio", { name: r, exact: true }).first().click();
    await p.waitForTimeout(450);
    if (i === 0 && k === 2) {
      // voltar preserva a resposta anterior
      await p.getByRole("button", { name: "Voltar" }).click();
      await p.waitForTimeout(300);
      ok((await p.getByRole("radio", { name: caso.resp[2], exact: true }).getAttribute("aria-checked")) === "true", "voltar mantém a resposta marcada");
      await p.getByRole("radio", { name: caso.resp[2], exact: true }).click();
      await p.waitForTimeout(450);
    }
    if (i === 0 && k === 3) {
      // recarregar no meio do quiz retoma da mesma pergunta, com a mesma sessão
      const sid = await p.evaluate(() => Object.entries(sessionStorage).find(([key]) => key.startsWith("fos_sid_"))?.[1]);
      await p.reload({ waitUntil: "load" });
      await p.waitForTimeout(900);
      ok(await p.getByText("O que você gostaria de conquistar").count() === 1, "recarregar a página retoma na pergunta 5");
      const sid2 = await p.evaluate(() => Object.entries(sessionStorage).find(([key]) => key.startsWith("fos_sid_"))?.[1]);
      ok(!!sid && sid === sid2, "mesma sessão depois de recarregar");
    }
  }
  ok(await p.getByText("Identificando oportunidades compatíveis com seu perfil...").count() === 1, "transição de análise em etapas");
  await p.getByText("Análise concluída", { exact: false }).first().waitFor({ timeout: 15000 });
  await p.waitForTimeout(1600); // deixa o Pixel atrasado aparecer
  const perfil = await p.locator("h1").first().textContent();
  ok(perfil?.trim() === caso.perfil, `perfil coerente: ${perfil?.trim()}`);
  ok(await p.getByText("Sua realidade", { exact: true }).count() === 1, "seção Sua realidade");
  ok(await p.getByText("Por que esse caminho?").count() === 1, "seção Por que esse caminho?");
  ok(await p.getByText("1º passo:").count() === 3, "3 caminhos com primeiro passo");
  if (shots) await p.screenshot({ path: `${shots}/e2e-resultado-${i}.png`, fullPage: true });
  await p.getByRole("link", { name: /quero conhecer o rota invisível/i }).click();
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
for (const r of PERFIS[1].resp) { await p.getByRole("radio", { name: r, exact: true }).first().click(); await p.waitForTimeout(400); }
await p.getByText("Análise concluída").first().waitFor({ timeout: 15000 });
await p.waitForTimeout(1700);
await p.getByRole("link", { name: /quero conhecer o rota invisível/i }).click();
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

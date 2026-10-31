// E2E da página de vendas personalizada (modelo Rota Invisível).
// Uso: BASE_URL=http://localhost:3000 ADMIN_EMAIL=... ADMIN_PASSWORD=... node e2e/rota.mjs
import { createRequire } from "node:module";
import postgres from "postgres";
const { chromium } = createRequire(import.meta.url)("playwright");

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? null;
const sql = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/funnelos");
const slug = `rota-${Date.now().toString(36)}`;
const CHECKOUT = "https://pay.example.com/rota-invisivel";
const assert = (c, m) => { if (!c) throw new Error(`FALHOU: ${m}`); console.log(`  ✓ ${m}`); };
const shot = (p, n) => SHOTS && p.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: true });

const browser = await chromium.launch();
const errors = [];
const watch = (p) => {
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => m.type() === "error" && !/ERR_TUNNEL|ERR_PROXY|Failed to load resource/.test(m.text()) && errors.push(m.text()));
};

console.log("1. Admin cria a campanha a partir do modelo Rota Invisível");
const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const admin = await adminCtx.newPage();
watch(admin);
await admin.goto(`${BASE}/login`);
await admin.fill("#email", process.env.ADMIN_EMAIL ?? "admin@e2e.test");
await admin.fill("#password", process.env.ADMIN_PASSWORD ?? "senha-super-segura");
await admin.click("button[type=submit]");
await admin.waitForURL("**/dashboard");
await admin.goto(`${BASE}/campaigns/new`);
await admin.getByRole("button", { name: /Duplicar um modelo/ }).click();
await admin.getByRole("button", { name: /Rota Invisível/ }).click();
await admin.getByPlaceholder("Ex.: Renda extra — Meta Ads outubro").fill("Rota Invisível E2E");
await admin.getByLabel("Slug (URL pública)").fill(slug);
await admin.locator("select").first().selectOption({ label: "Sem produto" });
await admin.getByRole("button", { name: "Criar campanha" }).click();
await admin.waitForURL(/\/campaigns\/[0-9a-f-]{36}\/quiz$/);
const campaignId = admin.url().split("/campaigns/")[1].split("/")[0];

console.log("2. Oferta: checkout e garantia configurados no painel");
await admin.goto(`${BASE}/campaigns/${campaignId}/sales-page`);
await admin.getByRole("tab", { name: /Oferta/ }).click();
await admin.getByLabel("URL de checkout").fill(CHECKOUT);
await admin.getByLabel("Garantia (texto)").fill("Se o conteúdo não atender às suas expectativas, solicite o reembolso pela plataforma de pagamento dentro do prazo.");
await admin.getByLabel("Período (dias)").fill("7");
await admin.getByRole("button", { name: /^Salvar/ }).click();
await admin.getByText("Alterações salvas no rascunho").waitFor();
await admin.getByRole("tab", { name: /Blocos/ }).click();
await admin.waitForTimeout(400);
await shot(admin, "00-editor");
await admin.getByRole("button", { name: "Publicar", exact: true }).click();
await admin.getByText("Campanha publicada").waitFor();
assert(true, "campanha publicada");

const profiles = [
  { pref: "Vender produtos", id: "vendedor", hero: /estoque para começar a vender/, insight: "Vender sem montar estoque" },
  { pref: "Prestar serviços", id: "servicos", hero: /sabe fazer pode ser o começo/, insight: "Transformar habilidades em serviços" },
  { pref: "Criar conteúdo na internet", id: "conteudo", hero: /Conteúdo pode virar renda/, insight: "Do conteúdo à monetização" },
  { pref: "Ainda não sei", id: "explorador", hero: /Você não precisa de mais dinheiro para começar/, insight: "Comparar antes de escolher" },
];

for (const [i, p] of profiles.entries()) {
  const mobile = i % 2 === 0;
  console.log(`3.${i + 1} Visitante (${mobile ? "celular" : "desktop"}) — perfil ${p.id}`);
  const ctx = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148", isMobile: true, hasTouch: true }
      : { viewport: { width: 1440, height: 900 } },
  );
  const v = await ctx.newPage();
  watch(v);
  await v.goto(`${BASE}/q/${slug}?utm_source=meta&utm_campaign=rota-${p.id}&utm_content=criativo-${i}`);
  await v.getByRole("button", { name: "Descobrir meu caminho" }).click();
  await v.getByRole("radio", { name: "R$ 1.000 a R$ 2.000" }).click();
  await v.getByRole("radio", { name: "Até 1 hora por dia" }).click();
  await v.getByRole("radio", { name: "Até R$ 50" }).click();
  await v.getByRole("radio", { name: p.pref }).click();
  await v.getByRole("radio", { name: "Não sei por onde começar" }).click();
  await v.getByRole("radio", { name: "Nos dois" }).click();
  await v.getByRole("radio", { name: "Não" }).click();
  await v.getByRole("link", { name: "Ver meu caminho" }).click();
  await v.waitForURL(/\/oferta\?s=/);
  const sessionId = new URL(v.url()).searchParams.get("s");

  const h1 = await v.locator("h1").first().textContent();
  assert(p.hero.test(h1), `hero da variação do perfil: “${h1.slice(0, 60)}…”`);
  const perso = v.locator("[data-block='personalized']");
  const persoText = await perso.textContent();
  assert(persoText.includes("Até R$ 50") && persoText.includes("Até 1 hora por dia") && persoText.includes("Não sei por onde começar") && persoText.includes(p.pref), "respostas reais exibidas");
  assert(persoText.includes(p.insight) && persoText.includes("Começar com pouco investimento"), `interpretação personalizada (“${p.insight}”)`);
  const bonusCount = await v.locator("[data-block='bonuses'] .grid > div").count();
  assert(bonusCount === 4, "4 bônus cadastrados exibidos");
  assert((await v.getByText("Garantia de 7 dias").count()) === 1, "garantia configurada exibida");
  assert((await v.getByText("R$ 19,90").count()) >= 1, "preço da oferta");

  // rola a página inteira (dispara offer_viewed / personalized_content_view)
  await perso.scrollIntoViewIfNeeded();
  await v.waitForTimeout(400);
  await v.locator("#oferta").scrollIntoViewIfNeeded();
  await v.waitForTimeout(600);
  if (i < 2) await shot(v, `oferta-${p.id}-${mobile ? "mobile" : "desktop"}`);

  // hero → rola até a oferta (não conta como clique de compra)
  const heroHref = await v.locator("[data-block='hero'] a").first().getAttribute("href");
  assert(heroHref === "#oferta", "CTA do hero leva à seção de oferta");

  // botão de compra: beacon purchase_button_click + redirect registrado pelo servidor
  const buy = v.locator("#oferta a[data-purchase]");
  const href = await buy.getAttribute("href");
  await buy.click({ noWaitAfter: true }).catch(() => {});
  await v.waitForTimeout(1500);
  const r = await fetch(new URL(href, BASE), { redirect: "manual" });
  const loc = new URL(r.headers.get("location"));
  assert(r.status === 303 && loc.origin + loc.pathname === CHECKOUT, "redireciona para o checkout cadastrado");
  assert(loc.searchParams.get("sck") === sessionId && loc.searchParams.get("utm_campaign") === `rota-${p.id}` && loc.searchParams.get("utm_content") === `criativo-${i}`, "sessão e UTMs preservadas até o checkout");

  const evs = await sql`select type, count(*)::int n from events where session_id = ${sessionId} group by type`;
  const by = Object.fromEntries(evs.map((e) => [e.type, e.n]));
  assert(by.sales_page_view === 1 && by.personalized_content_view === 1 && by.offer_viewed === 1, "sales_page_view, personalized_content_view e offer_viewed (uma vez cada)");
  assert(by.purchase_button_click >= 1 && by.checkout_redirect >= 1, "purchase_button_click e checkout_redirect registrados");
  assert(!by.purchase_confirmed, "clique no checkout não virou venda");
  const [s] = await sql`select profile_id, utm_source from visitor_sessions where id = ${sessionId}`;
  assert(s.profile_id === p.id && s.utm_source === "meta", "perfil e origem gravados na sessão");
  await ctx.close();
}

console.log("4. Visitante direto (sem quiz)");
const direct = await browser.newPage({ viewport: { width: 390, height: 844 } });
watch(direct);
await direct.goto(`${BASE}/q/${slug}/oferta`);
assert((await direct.locator("[data-block='personalized']").count()) === 0, "sem respostas → sem bloco personalizado (nada inventado)");
assert(/Você não precisa de mais dinheiro/.test(await direct.locator("h1").first().textContent()), "versão geral do hero");
assert((await direct.locator("#oferta a[data-purchase]").getAttribute("href")) === CHECKOUT, "sem sessão, botão aponta direto para o checkout cadastrado");

console.log("5. Visualização por perfil no rascunho");
const prev = await adminCtx.newPage();
watch(prev);
await prev.goto(`${BASE}/preview/${campaignId}`);
await prev.getByLabel("Ver página de vendas como perfil").selectOption({ label: "Prestador de serviços" });
assert(/sabe fazer/.test(await prev.locator("h1").first().textContent()), "preview por perfil mostra a variação");
await prev.close();

assert(errors.length === 0, `sem erros no console ${errors.length ? JSON.stringify(errors.slice(0, 5)) : ""}`);
console.log(`\nOK — ${BASE}/q/${slug}`);
await browser.close();
await sql.end();

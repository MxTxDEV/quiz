// Teste end-to-end do fluxo principal no navegador (Playwright).
// Uso: BASE_URL=http://localhost:3000 DATABASE_URL=... node e2e/flow.mjs
// Requer banco vazio (sem usuários) e modelos instalados (npm run db:seed).
import { createRequire } from "node:module";
// usa o Playwright instalado globalmente ou no projeto
const { chromium } = createRequire(import.meta.url)("playwright");
import { createHmac } from "node:crypto";
import postgres from "postgres";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS_DIR ?? null;
const sql = postgres(process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/funnelos");
const slug = `renda-e2e-${Date.now().toString(36)}`;
const assert = (cond, msg) => {
  if (!cond) throw new Error(`FALHOU: ${msg}`);
  console.log(`  ✓ ${msg}`);
};
const shot = async (page, name) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: true });

const browser = await chromium.launch();
const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const admin = await adminCtx.newPage();
const errors = [];
admin.on("pageerror", (e) => errors.push(e.message));

console.log("1. Configuração inicial e login");
await admin.goto(`${BASE}/setup`);
if (admin.url().includes("/setup")) {
  await admin.fill("#name", "Admin E2E");
  await admin.fill("#email", "admin@e2e.test");
  await admin.fill("#password", "senha-super-segura");
  await admin.click("button[type=submit]");
} else {
  await admin.goto(`${BASE}/login`);
  await admin.fill("#email", "admin@e2e.test");
  await admin.fill("#password", "senha-super-segura");
  await admin.click("button[type=submit]");
}
await admin.waitForURL("**/dashboard");
assert(await admin.getByRole("heading", { name: "Visão geral" }).isVisible(), "dashboard acessível após login");
await shot(admin, "01-dashboard-vazio");

console.log("2. Cadastro de produto");
await admin.goto(`${BASE}/products/new`);
await admin.getByLabel("Nome do produto").fill("Guia Renda Extra E2E");
await admin.getByLabel("Preço atual (R$)").fill("47,90");
await admin.getByLabel("URL do checkout").fill("https://checkout.example.com/guia");
await admin.getByRole("button", { name: "Adicionar item" }).first().click();
await admin.getByPlaceholder("Ex.: Aprenda a precificar").fill("Passo a passo para começar com pouco");
await admin.getByRole("button", { name: "Salvar produto" }).click();
await admin.waitForURL(/\/products\/[0-9a-f-]{36}$/);
assert(true, "produto salvo");

console.log("3. Nova campanha a partir de modelo");
await admin.goto(`${BASE}/campaigns/new`);
await admin.getByRole("button", { name: /Duplicar um modelo/ }).click();
await admin.getByRole("button", { name: /Quiz de renda extra/ }).click();
await admin.getByPlaceholder("Ex.: Renda extra — Meta Ads outubro").fill("Renda extra E2E");
await admin.getByLabel("Slug (URL pública)").fill(slug);
await admin.locator("select").first().selectOption({ label: "Guia Renda Extra E2E" });
await shot(admin, "02-nova-campanha");
await admin.getByRole("button", { name: "Criar campanha" }).click();
await admin.waitForURL(/\/campaigns\/[0-9a-f-]{36}\/quiz$/);
const campaignId = admin.url().split("/campaigns/")[1].split("/")[0];
assert((await admin.locator("text=7 pergunta(s)").count()) === 1, "quiz do modelo com 7 perguntas");

console.log("4. Quiz Builder: adicionar e editar pergunta, salvar");
await admin.getByRole("button", { name: "Adicionar pergunta" }).click();
await admin.getByRole("menuitem", { name: "Número" }).click();
await admin.getByLabel("Enunciado").fill("Quantas horas por semana você pode dedicar?");
await admin.getByLabel("Atributo registrado").fill("horas_semana");
await admin.getByText("Resposta obrigatória").click(); // torna opcional
await admin.waitForTimeout(300);
await shot(admin, "03-quiz-builder");
await admin.getByRole("button", { name: /^Salvar/ }).click();
await admin.getByText("Alterações salvas no rascunho").waitFor();
assert((await admin.locator("text=8 pergunta(s)").count()) === 1, "pergunta adicionada e persistida");

console.log("5. Regras e resultados");
await admin.goto(`${BASE}/campaigns/${campaignId}/results`);
await shot(admin, "04-perfis");
await admin.getByRole("tab", { name: /Regras de segmentação/ }).click();
assert((await admin.getByLabel("Nome da regra").count()) === 4, "4 regras do modelo exibidas");
await shot(admin, "05-regras");

console.log("6. Página de vendas e oferta");
await admin.goto(`${BASE}/campaigns/${campaignId}/sales-page`);
await admin.getByRole("tab", { name: /Oferta/ }).click();
assert((await admin.getByLabel("URL de checkout").inputValue()) === "https://checkout.example.com/guia", "oferta herdou checkout do produto");
await admin.getByLabel("Condições de pagamento").fill("ou 6x no cartão");
await admin.getByRole("button", { name: /^Salvar/ }).click();
await admin.getByText("Alterações salvas no rascunho").waitFor();
await admin.getByRole("tab", { name: /Blocos/ }).click();
await shot(admin, "06-pagina-vendas");

console.log("7. Publicar e copiar link");
await admin.getByRole("button", { name: "Publicar", exact: true }).click();
await admin.getByText("Campanha publicada").waitFor();
assert(true, "campanha publicada");

console.log("8. Visitante (mobile) responde o quiz");
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148" });
const v = await ctx.newPage();
v.on("pageerror", (e) => errors.push(e.message));
await v.goto(`${BASE}/q/${slug}?utm_source=facebook&utm_campaign=e2e&utm_content=criativo-a`);
await shot(v, "07-quiz-intro");
await v.getByRole("button", { name: "Começar" }).click();
await v.getByRole("radio", { name: "Até 1 hora" }).click();
// a pergunta adicionada no builder entra logo após a pergunta selecionada (a 1ª) e é opcional
await v.getByRole("heading", { name: "Quantas horas por semana você pode dedicar?" }).waitFor();
await v.getByRole("button", { name: "Pular pergunta" }).click();
await v.getByRole("radio", { name: "Até R$ 50" }).click();
await v.getByRole("radio", { name: "Vender produtos" }).click();
await shot(v, "08-quiz-pergunta");
await v.getByRole("radio", { name: "R$ 1.000 a R$ 2.000" }).click();
await v.getByRole("radio", { name: "Não" }).click();
await v.getByRole("checkbox", { name: "WhatsApp" }).click();
await v.getByRole("button", { name: "Continuar" }).click();
await v.getByPlaceholder(/quitar dívidas/).fill("Juntar dinheiro");
await v.getByRole("button", { name: "Continuar" }).click();
await v.getByText("Seu perfil: Vendedor de baixo investimento").waitFor({ timeout: 10000 });
assert(true, "regra aplicada: perfil Vendedor de baixo investimento");
await shot(v, "09-resultado");

console.log("9. Lead com consentimento");
await v.getByPlaceholder("Seu primeiro nome").fill("Ana");
await v.getByPlaceholder("Seu melhor e-mail").fill("ana@e2e.test");
await v.getByRole("checkbox").check();
await v.getByRole("button", { name: "Enviar" }).click();
await v.getByText("Seus dados foram registrados").waitFor();
assert(true, "lead capturado");

console.log("10. Oferta e clique no checkout");
await v.getByRole("link", { name: "Conheça o guia para começar" }).click();
await v.waitForURL(/\/oferta\?s=/);
await v.locator("[data-offer]").first().scrollIntoViewIfNeeded();
await v.waitForTimeout(800);
await shot(v, "10-oferta");
const sessionId = new URL(v.url()).searchParams.get("s");
// o redirect para o domínio externo é verificado via HTTP (o Chromium não intercepta redirects de navegação)
const href = await v.getByRole("link", { name: "Quero garantir meu acesso" }).first().getAttribute("href");
const redirect = await fetch(new URL(href, BASE), { redirect: "manual" });
assert(redirect.status === 303, "botão de compra registra o clique e redireciona (303)");
const checkoutUrl = new URL(redirect.headers.get("location"));
assert(checkoutUrl.searchParams.get("sck") === sessionId && checkoutUrl.searchParams.get("utm_source") === "facebook", "checkout recebeu sessão e UTMs");

console.log("11. Webhook de compra (genérico, assinado)");
await admin.goto(`${BASE}/integrations`);
await admin.getByRole("button", { name: "Novo endpoint" }).click();
await admin.getByLabel("Plataforma").selectOption("generic");
await admin.getByLabel("Nome", { exact: true }).fill("Genérico E2E");
await admin.getByRole("button", { name: "Criar endpoint" }).click();
await admin.getByText("Endpoint criado").waitFor();
const [hook] = await sql`select id, secret from webhook_endpoints where name = 'Genérico E2E' order by created_at desc limit 1`;
const body = JSON.stringify({ event: "purchase.confirmed", id: `E2E-${Date.now()}`, amount_cents: 4790, session_id: sessionId });
const bad = await fetch(`${BASE}/api/webhooks/generic/${hook.id}`, { method: "POST", body, headers: { "x-funnelos-signature": "sha256=00" } });
assert(bad.status === 401, "webhook com assinatura inválida rejeitado");
const ok = await fetch(`${BASE}/api/webhooks/generic/${hook.id}`, {
  method: "POST",
  body,
  headers: { "content-type": "application/json", "x-funnelos-signature": `sha256=${createHmac("sha256", hook.secret).update(body).digest("hex")}` },
});
assert(ok.status === 200, "webhook válido aceito");

console.log("12. Métricas no dashboard e na analytics da campanha");
const events = await sql`select type, count(*)::int as n from events where campaign_id = ${campaignId} group by type`;
const by = Object.fromEntries(events.map((e) => [e.type, e.n]));
assert(by.page_view === 1 && by.quiz_started === 1 && by.quiz_completed === 1, "eventos de visita, início e conclusão");
assert(by.result_viewed === 1 && by.offer_viewed === 1 && by.checkout_redirect === 1 && by.sales_page_view === 1 && by.lead_captured === 1 && by.purchase_confirmed === 1, "eventos de resultado, oferta, checkout, lead e compra");
const [s] = await sql`select device, utm_source, traffic_source, profile_id from visitor_sessions where id = ${sessionId}`;
assert(s.device === "mobile" && s.utm_source === "facebook" && s.profile_id === "vendedor", "sessão com dispositivo, UTM e perfil");
await admin.goto(`${BASE}/campaigns/${campaignId}/analytics`);
await admin.getByText("Funil de conversão").waitFor();
await shot(admin, "11-analytics");
await admin.goto(`${BASE}/dashboard`);
await shot(admin, "12-dashboard");

console.log("13. Preview do rascunho");
const prev = await adminCtx.newPage();
await prev.goto(`${BASE}/preview/${campaignId}`);
assert(await prev.getByText("nada é registrado").isVisible(), "preview acessível");
await prev.close();

assert(errors.length === 0, `sem erros de JavaScript no navegador ${errors.length ? JSON.stringify(errors) : ""}`);
console.log(`\nFluxo completo OK. Campanha: ${BASE}/q/${slug}`);
await browser.close();
await sql.end();

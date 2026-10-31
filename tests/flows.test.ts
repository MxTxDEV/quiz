import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, leads, visitorSessions } from "@/lib/db/schema";
import { createProduct, deleteProduct } from "@/lib/services/products";
import {
  createCampaign,
  duplicateCampaign,
  getCampaign,
  getPublishedCampaignBySlug,
  publishCampaign,
  saveCampaignSection,
  setCampaignStatus,
  SlugTakenError,
} from "@/lib/services/campaigns";
import { installBuiltinTemplates, listTemplates } from "@/lib/services/templates";
import {
  captureLead,
  checkoutRedirect,
  completeQuiz,
  markOfferViewed,
  markPersonalizedViewed,
  markResultViewed,
  markSalesPageViewed,
  recordPurchaseButtonClick,
  markStarted,
  startVisit,
  submitAnswer,
} from "@/lib/services/public-flow";
import { recordPurchase } from "@/lib/services/purchases";
import { eraseLead } from "@/lib/services/leads";
import { addAdSpend } from "@/lib/services/integrations";
import { funnelCounts, parseRange, answersByQuestion, byProfile, bySessionDimension, businessDate } from "@/lib/analytics/queries";
import { deriveMetrics } from "@/lib/analytics/metrics";
import { newQuestion } from "@/lib/domain/defaults";
import { resetDb } from "./helpers";

beforeEach(resetDb);

async function productFixture() {
  return createProduct({
    name: "Guia Renda Extra",
    priceCents: 4790,
    checkoutUrl: "https://pay.exemplo.com/guia",
    benefits: ["Passo a passo"],
    bonuses: [{ title: "Planilha", description: "" }],
  });
}

async function publishedFromTemplate(slug = "renda-extra") {
  await installBuiltinTemplates();
  const tpl = (await listTemplates()).find((t) => t.key === "renda-extra")!;
  const product = await productFixture();
  const campaign = await createCampaign({ name: "Renda", slug, productId: product.id, templateId: tpl.id });
  const res = await publishCampaign(campaign.id);
  expect(res).toEqual({ ok: true, issues: [] });
  return { campaign, product };
}

describe("produtos", () => {
  it("valida preço de referência e cadastra produto", async () => {
    await expect(createProduct({ name: "X", priceCents: 1000, referencePriceCents: 900 })).rejects.toThrow();
    await expect(createProduct({ name: "X", priceCents: 1000, referencePriceCents: 2000 })).rejects.toThrow(/Explique/);
    const p = await productFixture();
    expect(p.priceCents).toBe(4790);
  });
  it("não exclui produto vinculado a campanha", async () => {
    const p = await productFixture();
    await createCampaign({ name: "Camp C", slug: "camp-a", productId: p.id });
    await expect(deleteProduct(p.id)).rejects.toThrow(/vinculado/);
  });
});

describe("campanhas", () => {
  it("cria do zero com oferta herdada do produto e slug único", async () => {
    const p = await productFixture();
    const c = await createCampaign({ name: "Camp", slug: "minha-camp", productId: p.id });
    const full = await getCampaign(c.id);
    expect(full!.config.offer.checkoutUrl).toBe("https://pay.exemplo.com/guia");
    expect(full!.config.profiles.some((x) => x.isDefault)).toBe(true);
    await expect(createCampaign({ name: "Outra", slug: "minha-camp" })).rejects.toBeInstanceOf(SlugTakenError);
    await expect(createCampaign({ name: "Outra", slug: "api" })).rejects.toThrow();
  });

  it("rascunho não afeta a versão publicada até republicar", async () => {
    const { campaign } = await publishedFromTemplate();
    const full = (await getCampaign(campaign.id))!;
    await saveCampaignSection(campaign.id, "quiz", { ...full.config.quiz, questions: [...full.config.quiz.questions, newQuestion("text")] });
    const live = await getPublishedCampaignBySlug("renda-extra");
    expect(live!.config.quiz.questions).toHaveLength(7);
    await publishCampaign(campaign.id);
    expect((await getPublishedCampaignBySlug("renda-extra"))!.config.quiz.questions).toHaveLength(8);
  });

  it("pausar tira a campanha do ar; duplicar gera cópia independente em rascunho", async () => {
    const { campaign } = await publishedFromTemplate();
    const copy = await duplicateCampaign(campaign.id);
    expect(copy.status).toBe("draft");
    expect(copy.slug).not.toBe(campaign.slug);
    await setCampaignStatus(campaign.id, "paused");
    expect(await getPublishedCampaignBySlug("renda-extra")).toBeNull();
  });

  it("valida seção salva (rejeita configuração inválida)", async () => {
    const p = await productFixture();
    const c = await createCampaign({ name: "Camp", slug: "camp-x", productId: p.id });
    await expect(saveCampaignSection(c.id, "quiz", { questions: [{ id: "q", type: "inexistente" }] })).rejects.toThrow();
  });
});

describe("fluxo público completo", () => {
  it("visita → respostas → regras → resultado → lead → checkout → compra → métricas", async () => {
    const { campaign } = await publishedFromTemplate();
    const { sessionId } = await startVisit(
      { campaignId: campaign.id, params: { utm_source: "facebook", utm_campaign: "lancamento" }, referrer: "https://l.facebook.com/x?email=a@b.com" },
      "Mozilla/5.0 (iPhone) Mobile",
    );
    const [s0] = await db.select().from(visitorSessions).where(eq(visitorSessions.id, sessionId));
    expect(s0.device).toBe("mobile");
    expect(s0.referrer).toBe("https://l.facebook.com/x"); // sem query string

    await markStarted(sessionId);
    await markStarted(sessionId); // idempotente
    await expect(submitAnswer(sessionId, "tempo", "valor-forjado")).rejects.toThrow(/inválida/);
    await submitAnswer(sessionId, "tempo", "tempo_ate_1h");
    await submitAnswer(sessionId, "capital", "capital_ate_50");
    await expect(completeQuiz(sessionId)).rejects.toThrow(/obrigatórias/);
    await submitAnswer(sessionId, "preferencia", "preferencia_vendas");
    await submitAnswer(sessionId, "objetivo", "objetivo_1000_2000");
    await submitAnswer(sessionId, "experiencia", "no");
    await submitAnswer(sessionId, "canais", ["canais_whatsapp"]);
    await submitAnswer(sessionId, "motivo", "");

    const result = await completeQuiz(sessionId);
    expect(result.profile?.id).toBe("vendedor");
    expect(result.profile).not.toHaveProperty("isDefault");
    expect(result.ctaHref).toBe(`/q/renda-extra/oferta?s=${sessionId}`);
    expect((await completeQuiz(sessionId)).profile?.id).toBe("vendedor"); // idempotente
    await expect(submitAnswer(sessionId, "tempo", "tempo_mais_3h")).rejects.toThrow(/concluído/);

    const [s1] = await db.select().from(visitorSessions).where(eq(visitorSessions.id, sessionId));
    expect(s1.attributes).toMatchObject({ tempo_disponivel: "ate_1h", objetivo_financeiro: "1000_2000", canais: ["whatsapp"] });

    await markResultViewed(sessionId);
    await markResultViewed(sessionId);
    await expect(captureLead(sessionId, { email: "x@y.com", consent: false }, "1.1.1.1")).rejects.toThrow();
    await captureLead(sessionId, { name: "Ana", email: "ANA@exemplo.com", consent: true }, "1.1.1.1");
    await markSalesPageViewed(sessionId);
    await markSalesPageViewed(sessionId); // uma vez por sessão
    await markPersonalizedViewed(sessionId);
    await markOfferViewed(sessionId);
    await recordPurchaseButtonClick(sessionId, "b_offer");

    const url = new URL(await checkoutRedirect(sessionId));
    expect(url.searchParams.get("fos_sid")).toBe(sessionId);
    expect(url.searchParams.get("utm_source")).toBe("facebook");

    const range = parseRange({ period: "7d" });
    let counts = await funnelCounts(range, campaign.id);
    expect(counts).toMatchObject({ visitors: 1, started: 1, completed: 1, resultViews: 1, salesPageViews: 1, offerViews: 1, purchaseClicks: 1, checkoutClicks: 1, leads: 1, purchases: 0 });

    // clique não é venda; venda só via confirmação
    const p1 = await recordPurchase("generic", { externalId: "T1", status: "confirmed", amountCents: 4790, currency: "BRL", sessionId });
    expect(p1.created).toBe(true);
    const p2 = await recordPurchase("generic", { externalId: "T1", status: "confirmed", amountCents: 4790, currency: "BRL", sessionId });
    expect(p2.created).toBe(false); // webhook repetido não duplica
    await addAdSpend({ campaignId: campaign.id, date: businessDate(), amountCents: 2000 });

    counts = await funnelCounts(range, campaign.id);
    expect(counts.purchases).toBe(1);
    expect(counts.revenueCents).toBe(4790);
    const m = deriveMetrics(counts);
    expect(m.cpaCents).toBe(2000);
    expect(m.purchaseRate).toBe(1);

    const evs = await db.select().from(events).where(eq(events.sessionId, sessionId));
    const types = evs.map((e) => e.type);
    expect(types.filter((t) => t === "quiz_started")).toHaveLength(1);
    expect(types.filter((t) => t === "result_viewed")).toHaveLength(1);
    expect(types.filter((t) => t === "purchase_confirmed")).toHaveLength(1);
    expect(types.filter((t) => t === "sales_page_view")).toHaveLength(1);
    expect(types).toContain("personalized_content_view");
    expect(types).toContain("purchase_button_click");
    expect(types).toContain("checkout_redirect");
    // o clique e o redirecionamento não geram venda
    expect(evs.filter((e) => e.type === "checkout_redirect").every((e) => e.utmSource === "facebook")).toBe(true);
    expect(evs.every((e) => e.utmSource === "facebook" && e.device === "mobile")).toBe(true);
    expect(JSON.stringify(evs)).not.toContain("ana@exemplo.com"); // sem PII nos eventos

    expect((await answersByQuestion(range, campaign.id)).tempo).toBe(1);
    expect((await byProfile(range, campaign.id))[0]).toMatchObject({ key: "vendedor", purchases: 1 });
    expect((await bySessionDimension(range, campaign.id, "traffic_source"))[0]).toMatchObject({ key: "facebook", purchases: 1 });

    // reembolso: deixa de contar como venda confirmada
    await recordPurchase("generic", { externalId: "T1", status: "refunded", amountCents: 4790, currency: "BRL", sessionId });
    expect((await funnelCounts(range, campaign.id)).purchases).toBe(0);

    // LGPD: exclusão remove dados pessoais
    const [lead] = await db.select().from(leads);
    expect(lead.email).toBe("ana@exemplo.com");
    await eraseLead(lead.id);
    const [erased] = await db.select().from(leads);
    expect(erased.email).toBeNull();
    expect(erased.name).toBeNull();
  });

  it("campanhas não interferem entre si", async () => {
    const { campaign: a } = await publishedFromTemplate("camp-a");
    const tpl = (await listTemplates()).find((t) => t.key === "marketing-digital")!;
    const b = await createCampaign({ name: "Camp B", slug: "camp-b", templateId: tpl.id });
    await saveCampaignSection(b.id, "offer", { ...(await getCampaign(b.id))!.config.offer, checkoutUrl: "https://pay.exemplo.com/b" });
    await publishCampaign(b.id);
    const v = await startVisit({ campaignId: a.id, params: {} }, null);
    // pergunta da campanha B não é aceita numa sessão da campanha A
    await expect(submitAnswer(v.sessionId, "m1", "m1_nunca")).rejects.toThrow(/não encontrada/);
    const range = parseRange({ period: "7d" });
    expect((await funnelCounts(range, b.id)).visitors).toBe(0);
    expect((await funnelCounts(range, a.id)).visitors).toBe(1);
  });

  it("não aceita visitas em campanha não publicada", async () => {
    const c = await createCampaign({ name: "Draft", slug: "rascunho" });
    await expect(startVisit({ campaignId: c.id, params: {} }, null)).rejects.toThrow(/indisponível/);
  });
});

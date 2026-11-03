import { createHash } from "node:crypto";
import { z } from "zod";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, leads, visitorSessions, type VisitorSession } from "@/lib/db/schema";
import { parseConfig, type CampaignConfig } from "@/lib/domain/config";
import { toPublicProfile, type PublicProfile } from "@/lib/domain/public";
import { normalizeAnswer, type Answers, type Attributes } from "@/lib/engine/answers";
import { resolveProfile, resultReasons } from "@/lib/engine/rules";
import { classifySource, detectDevice, pickUtm } from "@/lib/tracking/context";
import { buildCheckoutUrl } from "@/lib/tracking/checkout";
import { recordEvent, recordEventOnce } from "./events";
import { dispatchOutgoing } from "@/lib/integrations/outgoing-webhook";

export class PublicFlowError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type LoadedSession = { session: VisitorSession; config: CampaignConfig; campaignStatus: string };

/** Carrega sessão + configuração publicada. A campanha precisa estar publicada. */
export async function loadSession(sessionId: string): Promise<LoadedSession> {
  if (!z.string().uuid().safeParse(sessionId).success) throw new PublicFlowError("Sessão inválida", 404);
  const [row] = await db
    .select({ session: visitorSessions, status: campaigns.status, publishedConfig: campaigns.publishedConfig })
    .from(visitorSessions)
    .innerJoin(campaigns, eq(campaigns.id, visitorSessions.campaignId))
    .where(eq(visitorSessions.id, sessionId))
    .limit(1);
  if (!row) throw new PublicFlowError("Sessão não encontrada", 404);
  if (row.status !== "published" || !row.publishedConfig) throw new PublicFlowError("Campanha indisponível", 410);
  return { session: row.session, config: parseConfig(row.publishedConfig), campaignStatus: row.status };
}

export const startVisitSchema = z.object({
  campaignId: z.string().uuid(),
  visitorId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/).optional(),
  params: z.record(z.string(), z.string().max(500)).default({}),
  referrer: z.string().max(2000).nullable().default(null),
});

/** Cria a sessão do visitante e registra page_view. */
export async function startVisit(input: z.input<typeof startVisitSchema>, userAgent: string | null) {
  const data = startVisitSchema.parse(input);
  const [campaign] = await db
    .select({ id: campaigns.id, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, data.campaignId))
    .limit(1);
  if (!campaign || campaign.status !== "published") throw new PublicFlowError("Campanha indisponível", 404);

  const utm = pickUtm(data.params);
  const visitorId = data.visitorId ?? crypto.randomUUID().replace(/-/g, "");
  let referrer: string | null = null;
  if (data.referrer) {
    try {
      const u = new URL(data.referrer);
      referrer = `${u.origin}${u.pathname}`; // descarta query string (pode conter dados pessoais)
    } catch {
      referrer = null;
    }
  }
  const [session] = await db
    .insert(visitorSessions)
    .values({
      campaignId: campaign.id,
      visitorId,
      referrer,
      ...utm,
      trafficSource: classifySource(utm, referrer, data.params),
      device: detectDevice(userAgent),
    })
    .returning();
  await recordEvent(session, "page_view");
  return { sessionId: session.id, visitorId };
}

export async function markStarted(sessionId: string) {
  const { session } = await loadSession(sessionId);
  const updated = await db
    .update(visitorSessions)
    .set({ startedAt: new Date() })
    .where(and(eq(visitorSessions.id, session.id), isNull(visitorSessions.startedAt)))
    .returning({ id: visitorSessions.id });
  if (updated.length) await recordEvent(session, "quiz_started");
}

export async function submitAnswer(sessionId: string, questionId: string, raw: unknown) {
  const { session, config } = await loadSession(sessionId);
  if (session.completedAt) throw new PublicFlowError("Quiz já concluído", 409);
  const index = config.quiz.questions.findIndex((q) => q.id === questionId);
  if (index < 0) throw new PublicFlowError("Pergunta não encontrada", 404);
  const question = config.quiz.questions[index];
  const check = normalizeAnswer(question, raw);
  if (!check.ok) throw new PublicFlowError(check.error, 422);

  if (!session.startedAt) await markStarted(sessionId);
  const patch = check.value === null ? sql`${visitorSessions.answers} - ${questionId}` : sql`${visitorSessions.answers} || ${JSON.stringify({ [questionId]: check.value })}::jsonb`;
  await db.update(visitorSessions).set({ answers: patch }).where(eq(visitorSessions.id, session.id));
  await recordEvent(session, "question_answered", { questionId, metadata: { index, skipped: check.value === null } });
  return { ok: true };
}

export type CompletionResult = { profile: PublicProfile | null; ctaHref: string; reasons: string[] };

function ctaHref(slug: string, sessionId: string, profile: { ctaTarget: string } | null) {
  return profile?.ctaTarget === "checkout"
    ? `/api/public/checkout?s=${sessionId}`
    : `/q/${slug}/oferta?s=${sessionId}`;
}

/** Executa o motor de regras no servidor e fixa o perfil da sessão (idempotente). */
export async function completeQuiz(sessionId: string): Promise<CompletionResult> {
  const { session, config } = await loadSession(sessionId);
  const [c] = await db.select({ slug: campaigns.slug }).from(campaigns).where(eq(campaigns.id, session.campaignId));

  if (session.completedAt) {
    const profile = config.profiles.find((p) => p.id === session.profileId) ?? null;
    const reasons = resultReasons(config, { answers: session.answers as Answers, attributes: session.attributes as Attributes, score: session.score });
    return { profile: profile && toPublicProfile(profile), ctaHref: ctaHref(c.slug, session.id, profile), reasons };
  }

  const answers = session.answers as Answers;
  const missing = config.quiz.questions.filter((q) => q.required && (answers[q.id] === undefined || answers[q.id] === null));
  if (missing.length) throw new PublicFlowError("Responda todas as perguntas obrigatórias", 422);

  const result = resolveProfile(config, answers);
  const updated = await db
    .update(visitorSessions)
    .set({
      attributes: result.attributes,
      score: Math.round(result.score),
      profileId: result.profile?.id ?? null,
      completedAt: new Date(),
    })
    .where(and(eq(visitorSessions.id, session.id), isNull(visitorSessions.completedAt)))
    .returning({ id: visitorSessions.id });
  if (updated.length)
    await recordEvent(session, "quiz_completed", {
      profileId: result.profile?.id ?? null,
      metadata: { matchedRuleId: result.matchedRuleId },
    });
  return { profile: result.profile && toPublicProfile(result.profile), ctaHref: ctaHref(c.slug, session.id, result.profile), reasons: result.reasons };
}

export async function markResultViewed(sessionId: string) {
  const { session } = await loadSession(sessionId);
  if (!session.completedAt) throw new PublicFlowError("Quiz não concluído", 409);
  await recordEventOnce(session, "result_viewed", { profileId: session.profileId });
}

export async function markOfferViewed(sessionId: string) {
  const { session } = await loadSession(sessionId);
  await recordEventOnce(session, "offer_viewed", { profileId: session.profileId });
}

export async function markSalesPageViewed(sessionId: string) {
  const { session } = await loadSession(sessionId);
  await recordEventOnce(session, "sales_page_view", { profileId: session.profileId });
}

export async function markPersonalizedViewed(sessionId: string) {
  const { session } = await loadSession(sessionId);
  await recordEventOnce(session, "personalized_content_view", { profileId: session.profileId });
}

/** Clique em botão de compra (intenção). Não é venda e não é o redirecionamento. */
export async function recordPurchaseButtonClick(sessionId: string, blockId?: string | null) {
  const { session, config } = await loadSession(sessionId);
  await recordEvent(session, "purchase_button_click", {
    profileId: session.profileId,
    valueCents: config.offer.priceCents,
    metadata: blockId ? { blockId: blockId.slice(0, 64) } : {},
  });
}

export const leadInputSchema = z.object({
  name: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().toLowerCase().email("E-mail inválido").max(200),
  consent: z.literal(true, { message: "É preciso aceitar para enviar seus dados" }),
});

export async function captureLead(sessionId: string, input: unknown, ip: string) {
  const { session, config } = await loadSession(sessionId);
  if (config.leadCapture.mode === "off") throw new PublicFlowError("Captura de leads desativada", 400);
  const data = leadInputSchema.parse(input);
  const [existing] = await db.select({ id: leads.id }).from(leads).where(eq(leads.sessionId, session.id)).limit(1);
  if (existing) return { ok: true, duplicated: true };

  const ipHash = createHash("sha256")
    .update(`${process.env.APP_SECRET ?? ""}:${ip}`)
    .digest("hex")
    .slice(0, 32);
  const [lead] = await db
    .insert(leads)
    .values({
      campaignId: session.campaignId,
      sessionId: session.id,
      name: config.leadCapture.askName ? data.name || null : null,
      email: data.email,
      profileId: session.profileId,
      consent: true,
      consentText: config.leadCapture.consentText,
      consentAt: new Date(),
      ipHash,
    })
    .returning();
  // evento sem PII: apenas o fato de o lead ter sido capturado
  await recordEvent(session, "lead_captured", { profileId: session.profileId });
  void dispatchOutgoing("lead_captured", {
    leadId: lead.id,
    campaignId: session.campaignId,
    name: lead.name,
    email: lead.email,
    profileId: session.profileId,
    attributes: session.attributes,
  });
  return { ok: true, duplicated: false };
}

/** Registra o clique e devolve a URL externa (com sessão e UTMs para atribuição). */
export async function checkoutRedirect(sessionId: string, blockId?: string | null) {
  const { session, config } = await loadSession(sessionId);
  const url = buildCheckoutUrl(config.offer.checkoutUrl, session.id, {
    utm_source: session.utmSource,
    utm_medium: session.utmMedium,
    utm_campaign: session.utmCampaign,
    utm_content: session.utmContent,
    utm_term: session.utmTerm,
  });
  if (!url) throw new PublicFlowError("Checkout não configurado", 404);
  await recordEvent(session, "checkout_redirect", {
    profileId: session.profileId,
    valueCents: config.offer.priceCents,
    metadata: blockId ? { blockId: blockId.slice(0, 64) } : {},
  });
  return url;
}

export async function getSessionProfile(sessionId: string) {
  const { session, config } = await loadSession(sessionId);
  const profile = config.profiles.find((p) => p.id === session.profileId) ?? null;
  return { session, config, profile };
}

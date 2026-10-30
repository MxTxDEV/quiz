import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, purchases, visitorSessions } from "@/lib/db/schema";
import type { NormalizedPurchase } from "@/lib/integrations/checkout-providers";
import { dispatchOutgoing } from "@/lib/integrations/outgoing-webhook";
import { recordEvent } from "./events";

/**
 * Registra/atualiza uma venda de forma idempotente (provider + externalId).
 * O evento purchase_confirmed é criado apenas na primeira confirmação.
 */
export async function recordPurchase(
  provider: string,
  p: NormalizedPurchase,
  opts: { campaignId?: string | null; raw?: Record<string, unknown> } = {},
) {
  const session = p.sessionId
    ? (await db.select().from(visitorSessions).where(eq(visitorSessions.id, p.sessionId)).limit(1))[0] ?? null
    : null;
  const campaignId = session?.campaignId ?? opts.campaignId ?? null;

  const [existing] = await db
    .select()
    .from(purchases)
    .where(and(eq(purchases.provider, provider), eq(purchases.externalId, p.externalId)))
    .limit(1);

  if (existing) {
    if (existing.status !== p.status) await db.update(purchases).set({ status: p.status }).where(eq(purchases.id, existing.id));
    return { purchase: { ...existing, status: p.status }, created: false };
  }

  const inserted = await db
    .insert(purchases)
    .values({
      provider,
      externalId: p.externalId,
      status: p.status,
      amountCents: p.amountCents,
      currency: p.currency,
      campaignId,
      sessionId: session?.id ?? null,
      profileId: session?.profileId ?? null,
      raw: opts.raw ?? {},
    })
    .onConflictDoNothing()
    .returning();
  const purchase = inserted[0];
  if (!purchase) return { purchase: null, created: false }; // corrida: outra requisição inseriu

  if (p.status === "confirmed" && session) {
    await recordEvent(session, "purchase_confirmed", { profileId: session.profileId, valueCents: p.amountCents });
  } else if (p.status === "confirmed" && campaignId) {
    // venda sem sessão rastreada: evento com dados mínimos para manter o funil consistente
    await recordEvent(
      {
        id: null,
        campaignId,
        visitorId: "",
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        utmContent: null,
        utmTerm: null,
        trafficSource: "unattributed",
        device: "desktop",
      },
      "purchase_confirmed",
      { valueCents: p.amountCents, metadata: { unattributed: true } },
    );
  }
  if (p.status === "confirmed")
    void dispatchOutgoing("purchase_confirmed", { purchaseId: purchase.id, campaignId, amountCents: p.amountCents, provider });
  return { purchase, created: true };
}

export const manualPurchaseSchema = z.object({
  campaignId: z.string().uuid(),
  externalId: z.string().trim().min(1, "Informe o identificador da venda").max(200),
  amountCents: z.number().int().min(0),
  sessionId: z.string().uuid().nullable().default(null),
});

/** Registro manual explícito (ex.: venda conferida no painel da plataforma). */
export async function recordManualPurchase(input: z.input<typeof manualPurchaseSchema>) {
  const data = manualPurchaseSchema.parse(input);
  return recordPurchase(
    "manual",
    { externalId: data.externalId, status: "confirmed", amountCents: data.amountCents, currency: "BRL", sessionId: data.sessionId },
    { campaignId: data.campaignId, raw: { manual: true } },
  );
}

export async function listPurchases(limit = 50) {
  return db
    .select({ purchase: purchases, campaignName: campaigns.name })
    .from(purchases)
    .leftJoin(campaigns, eq(campaigns.id, purchases.campaignId))
    .orderBy(desc(purchases.confirmedAt))
    .limit(limit);
}

import { createHash } from "node:crypto";
import { z } from "zod";
import { and, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, purchases, reviews } from "@/lib/db/schema";
import { PublicFlowError } from "./public-flow";

/**
 * Avaliações de compradores — prova social real.
 * Fluxo: comprador envia pelo link /avaliar/<slug> → fica pendente → alguém aprova no painel → aparece na página.
 * Nada é publicado sem aprovação, nada é publicado sem autorização do autor e o e-mail nunca é exibido.
 */

export const REVIEW_CONSENT_TEXT =
  "Autorizo a exibição desta avaliação, com meu primeiro nome e cidade, na página do produto. Posso pedir a remoção quando quiser.";

const reviewInputSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(60),
  city: z.string().trim().max(60).default(""),
  rating: z.coerce.number().int().min(1, "Escolha de 1 a 5 estrelas").max(5),
  text: z.string().trim().min(20, "Conte um pouco mais (mínimo de 20 caracteres)").max(800, "Use no máximo 800 caracteres"),
  email: z.string().trim().toLowerCase().email("Informe o e-mail usado na compra").max(200),
  consent: z.literal(true, { message: "É preciso autorizar a exibição da avaliação" }),
  /** campo invisível anti-robô: humanos deixam vazio */
  website: z.string().max(0).optional().default(""),
});
export type ReviewInput = z.input<typeof reviewInputSchema>;

/** "maria silva souza" → "Maria S." (privacidade: nunca o nome completo) */
export function displayName(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const cap = (w: string) => w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1).toLocaleLowerCase("pt-BR");
  if (parts.length === 0) return "";
  return parts.length === 1 ? cap(parts[0]) : `${cap(parts[0])} ${parts[parts.length - 1].charAt(0).toLocaleUpperCase("pt-BR")}.`;
}

/** O e-mail aparece no payload de uma venda confirmada desta campanha? (Kiwify, Hotmart e genérico guardam o comprador no raw) */
async function isBuyer(campaignId: string, email: string) {
  const [row] = await db
    .select({ n: count() })
    .from(purchases)
    .where(and(eq(purchases.campaignId, campaignId), eq(purchases.status, "confirmed"), sql`lower(${purchases.raw}::text) like ${"%" + email.replace(/[%_\\]/g, "") + "%"}`));
  return (row?.n ?? 0) > 0;
}

export async function submitReview(slug: string, input: ReviewInput, ip: string) {
  const data = reviewInputSchema.parse(input);
  const [campaign] = await db.select({ id: campaigns.id, status: campaigns.status }).from(campaigns).where(eq(campaigns.slug, slug)).limit(1);
  if (!campaign || campaign.status !== "published") throw new PublicFlowError("Página de avaliação não encontrada.", 404);

  const ipHash = createHash("sha256").update(`${process.env.APP_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
  // uma avaliação por e-mail por campanha (reenvio atualiza a anterior e volta para aprovação)
  const verified = await isBuyer(campaign.id, data.email);
  const values = {
    campaignId: campaign.id,
    name: displayName(data.name),
    city: data.city,
    rating: data.rating,
    text: data.text,
    email: data.email,
    verified,
    consent: true,
    consentText: REVIEW_CONSENT_TEXT,
    status: "pending" as const,
    ipHash,
    reviewedAt: null,
  };
  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.campaignId, campaign.id), eq(reviews.email, data.email)))
    .limit(1);
  if (existing) await db.update(reviews).set(values).where(eq(reviews.id, existing.id));
  else await db.insert(reviews).values(values);
  return { ok: true, verified };
}

export async function listReviews(campaignId: string) {
  return db.select().from(reviews).where(eq(reviews.campaignId, campaignId)).orderBy(desc(reviews.createdAt)).limit(500);
}

export async function setReviewStatus(id: string, status: "approved" | "rejected" | "pending") {
  const [row] = await db.update(reviews).set({ status, reviewedAt: new Date() }).where(eq(reviews.id, id)).returning({ campaignId: reviews.campaignId });
  return row ?? null;
}

export async function deleteReview(id: string) {
  await db.delete(reviews).where(eq(reviews.id, id));
}

export type PublicReview = { id: string; name: string; city: string; rating: number; text: string; verified: boolean; createdAt: string };

/** Dados de prova social para a página pública: avaliações aprovadas e o total real de compradores. */
export async function socialProof(campaignId: string, limit = 12) {
  const [rows, [buyers], [agg]] = await Promise.all([
    db
      .select({ id: reviews.id, name: reviews.name, city: reviews.city, rating: reviews.rating, text: reviews.text, verified: reviews.verified, createdAt: reviews.createdAt })
      .from(reviews)
      .where(and(eq(reviews.campaignId, campaignId), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.verified), desc(reviews.createdAt))
      .limit(limit),
    db.select({ n: count() }).from(purchases).where(and(eq(purchases.campaignId, campaignId), eq(purchases.status, "confirmed"))),
    db
      .select({ n: count(), avg: sql<string | null>`avg(${reviews.rating})` })
      .from(reviews)
      .where(and(eq(reviews.campaignId, campaignId), eq(reviews.status, "approved"))),
  ]);
  return {
    reviews: rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) as PublicReview[],
    reviewCount: agg?.n ?? 0,
    average: agg?.avg ? Math.round(Number(agg.avg) * 10) / 10 : null,
    buyers: buyers?.n ?? 0,
  };
}
export type SocialProof = Awaited<ReturnType<typeof socialProof>>;

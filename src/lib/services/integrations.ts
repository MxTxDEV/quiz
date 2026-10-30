import { randomBytes } from "node:crypto";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { adSpend, campaigns, webhookEndpoints } from "@/lib/db/schema";

export const webhookInputSchema = z.object({
  provider: z.enum(["generic", "hotmart", "kiwify"]),
  name: z.string().trim().min(2, "Informe um nome").max(120),
  campaignId: z.string().uuid().nullable().default(null),
  /** Hotmart/Kiwify: token fornecido pela plataforma. Genérico: gerado automaticamente se vazio. */
  secret: z.string().trim().max(200).default(""),
});

export async function listWebhooks() {
  return db
    .select({ endpoint: webhookEndpoints, campaignName: campaigns.name })
    .from(webhookEndpoints)
    .leftJoin(campaigns, eq(campaigns.id, webhookEndpoints.campaignId))
    .orderBy(desc(webhookEndpoints.createdAt));
}

export async function createWebhook(input: z.input<typeof webhookInputSchema>) {
  const data = webhookInputSchema.parse(input);
  if (data.provider !== "generic" && data.secret.length < 8)
    throw new Error("Informe o token/segredo fornecido pela plataforma (mínimo 8 caracteres).");
  const secret = data.secret || randomBytes(24).toString("base64url");
  const [row] = await db.insert(webhookEndpoints).values({ ...data, secret }).returning();
  return row;
}

export async function setWebhookActive(id: string, active: boolean) {
  await db.update(webhookEndpoints).set({ active }).where(eq(webhookEndpoints.id, id));
}

export async function deleteWebhook(id: string) {
  await db.delete(webhookEndpoints).where(eq(webhookEndpoints.id, id));
}

export async function getWebhook(id: string) {
  const [row] = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, id)).limit(1);
  return row ?? null;
}

export const adSpendSchema = z.object({
  campaignId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  amountCents: z.number().int().positive("Informe um valor maior que zero").max(100_000_000_00),
  source: z.string().trim().min(1).max(60).default("meta"),
  note: z.string().trim().max(300).default(""),
});

export async function addAdSpend(input: z.input<typeof adSpendSchema>) {
  const data = adSpendSchema.parse(input);
  const [row] = await db.insert(adSpend).values(data).returning();
  return row;
}

export async function listAdSpend(campaignId: string) {
  return db.select().from(adSpend).where(eq(adSpend.campaignId, campaignId)).orderBy(desc(adSpend.date)).limit(200);
}

export async function deleteAdSpend(id: string) {
  await db.delete(adSpend).where(eq(adSpend.id, id));
}

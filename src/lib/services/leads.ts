import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, leads } from "@/lib/db/schema";

export async function listLeads(opts: { campaignId?: string; search?: string; limit?: number } = {}) {
  const where = [isNull(leads.deletedAt)];
  if (opts.campaignId) where.push(eq(leads.campaignId, opts.campaignId));
  if (opts.search) where.push(ilike(leads.email, `%${opts.search.replace(/[%_]/g, "")}%`));
  return db
    .select({ lead: leads, campaignName: campaigns.name })
    .from(leads)
    .innerJoin(campaigns, eq(campaigns.id, leads.campaignId))
    .where(and(...where))
    .orderBy(desc(leads.createdAt))
    .limit(opts.limit ?? 200);
}

/**
 * Exclusão de dados pessoais (LGPD art. 18): remove nome, e-mail e hash de IP.
 * O registro anonimizado permanece apenas para não distorcer contagens históricas.
 */
export async function eraseLead(id: string) {
  await db
    .update(leads)
    .set({ name: null, email: null, ipHash: null, deletedAt: new Date() })
    .where(eq(leads.id, id));
}

/** Exclui todos os dados pessoais associados a um e-mail, em todas as campanhas. */
export async function eraseByEmail(email: string) {
  const rows = await db
    .update(leads)
    .set({ name: null, email: null, ipHash: null, deletedAt: new Date() })
    .where(eq(leads.email, email.trim().toLowerCase()))
    .returning({ id: leads.id });
  return rows.length;
}

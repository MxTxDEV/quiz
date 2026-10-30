import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, products } from "@/lib/db/schema";

const url = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Use uma URL iniciando com http:// ou https://");

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, "Informe o nome do produto").max(200),
    coverImageUrl: url.default(""),
    description: z.string().trim().max(5000).default(""),
    category: z.string().trim().max(100).default(""),
    priceCents: z.number().int().min(0, "Preço inválido").max(100_000_000),
    referencePriceCents: z.number().int().min(0).max(100_000_000).nullable().default(null),
    referencePriceNote: z.string().trim().max(300).default(""),
    checkoutUrl: url.default(""),
    benefits: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
    deliverables: z.array(z.string().trim().min(1).max(300)).max(30).default([]),
    bonuses: z.array(z.object({ title: z.string().trim().min(1).max(300), description: z.string().trim().max(1000).default("") })).max(20).default([]),
    guarantee: z.string().trim().max(1000).default(""),
    status: z.enum(["active", "inactive"]).default("active"),
  })
  .superRefine((p, ctx) => {
    if (p.referencePriceCents != null) {
      if (p.referencePriceCents <= p.priceCents)
        ctx.addIssue({ code: "custom", path: ["referencePriceCents"], message: "O preço de referência deve ser maior que o preço atual." });
      if (!p.referencePriceNote)
        ctx.addIssue({ code: "custom", path: ["referencePriceNote"], message: "Explique de onde vem o preço de referência." });
    }
  });
export type ProductInput = z.input<typeof productInputSchema>;

export async function listProducts() {
  return db
    .select({
      product: products,
      campaignCount: sql<number>`(select count(*)::int from ${campaigns} where ${campaigns.productId} = ${products.id})`,
    })
    .from(products)
    .orderBy(desc(products.createdAt));
}

export async function getProduct(id: string) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return row ?? null;
}

export async function createProduct(input: ProductInput) {
  const data = productInputSchema.parse(input);
  const [row] = await db.insert(products).values(data).returning();
  return row;
}

export async function updateProduct(id: string, input: ProductInput) {
  const data = productInputSchema.parse(input);
  const [row] = await db.update(products).set(data).where(eq(products.id, id)).returning();
  return row ?? null;
}

/** Produtos vinculados a campanhas não são apagados (campanhas guardam a referência). */
export async function deleteProduct(id: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(campaigns)
    .where(eq(campaigns.productId, id));
  if (count > 0) throw new Error(`Este produto está vinculado a ${count} campanha(s). Desative-o em vez de excluir.`);
  await db.delete(products).where(eq(products.id, id));
}

import { z } from "zod";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { campaigns, products, templates, type CampaignStatus } from "@/lib/db/schema";
import { campaignConfigSchema, parseConfig, publishIssues, type CampaignConfig } from "@/lib/domain/config";
import { offerFromProduct, starterConfig } from "@/lib/domain/defaults";
import { slugify } from "@/lib/utils";

export const RESERVED_SLUGS = new Set(["admin", "api", "login", "setup", "preview", "oferta", "privacidade"]);

export const slugSchema = z
  .string()
  .trim()
  .min(3, "O slug precisa de pelo menos 3 caracteres")
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens")
  .refine((s) => !RESERVED_SLUGS.has(s), "Slug reservado pelo sistema");

export const campaignMetaSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome interno").max(200),
  description: z.string().trim().max(2000).default(""),
  slug: slugSchema,
  productId: z.string().uuid().nullable().default(null),
});

export const createCampaignSchema = campaignMetaSchema.extend({
  templateId: z.string().uuid().nullable().default(null),
});
export type CreateCampaignInput = z.input<typeof createCampaignSchema>;

export class SlugTakenError extends Error {
  constructor() {
    super("Este slug já está em uso por outra campanha.");
  }
}

async function assertSlugFree(slug: string, exceptId?: string) {
  const [row] = await db
    .select({ id: campaigns.id })
    .from(campaigns)
    .where(exceptId ? and(eq(campaigns.slug, slug), ne(campaigns.id, exceptId)) : eq(campaigns.slug, slug))
    .limit(1);
  if (row) throw new SlugTakenError();
}

export async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || "campanha";
  let candidate = root.length < 3 ? `${root}-quiz` : root;
  for (let i = 2; i < 200; i++) {
    const [row] = await db.select({ id: campaigns.id }).from(campaigns).where(eq(campaigns.slug, candidate)).limit(1);
    if (!row && !RESERVED_SLUGS.has(candidate)) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function listCampaigns(opts: { includeArchived?: boolean } = {}) {
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      slug: campaigns.slug,
      status: campaigns.status,
      productId: campaigns.productId,
      productName: products.name,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,
      publishedAt: campaigns.publishedAt,
      questionCount: sql<number>`coalesce(jsonb_array_length(${campaigns.config}->'quiz'->'questions'), 0)::int`,
      hasUnpublishedChanges: sql<boolean>`(${campaigns.publishedConfig} is not null and ${campaigns.publishedConfig} <> ${campaigns.config})`,
    })
    .from(campaigns)
    .leftJoin(products, eq(products.id, campaigns.productId))
    .orderBy(desc(campaigns.updatedAt));
  return opts.includeArchived ? rows : rows.filter((r) => r.status !== "archived");
}

export async function getCampaign(id: string) {
  const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
  if (!row) return null;
  return { ...row, config: parseConfig(row.config) };
}

export async function getPublishedCampaignBySlug(slug: string) {
  const [row] = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      slug: campaigns.slug,
      status: campaigns.status,
      publishedConfig: campaigns.publishedConfig,
    })
    .from(campaigns)
    .where(and(eq(campaigns.slug, slug), eq(campaigns.status, "published")))
    .limit(1);
  if (!row || !row.publishedConfig) return null;
  return { id: row.id, name: row.name, slug: row.slug, config: parseConfig(row.publishedConfig) };
}

export async function createCampaign(input: CreateCampaignInput) {
  const data = createCampaignSchema.parse(input);
  await assertSlugFree(data.slug);

  const product = data.productId
    ? (await db.select().from(products).where(eq(products.id, data.productId)).limit(1))[0] ?? null
    : null;

  let config: CampaignConfig;
  if (data.templateId) {
    const [tpl] = await db.select().from(templates).where(eq(templates.id, data.templateId)).limit(1);
    if (!tpl) throw new Error("Modelo não encontrado.");
    config = parseConfig(structuredClone(tpl.config));
    // o produto escolhido define a oferta; o restante vem do modelo
    if (product) config.offer = offerFromProduct(product, config.offer);
  } else {
    config = starterConfig(product);
  }

  const [row] = await db
    .insert(campaigns)
    .values({ name: data.name, description: data.description, slug: data.slug, productId: data.productId, config })
    .returning();
  return row;
}

export async function updateCampaignMeta(id: string, input: z.input<typeof campaignMetaSchema>) {
  const data = campaignMetaSchema.parse(input);
  await assertSlugFree(data.slug, id);
  const [row] = await db.update(campaigns).set(data).where(eq(campaigns.id, id)).returning();
  return row ?? null;
}

/** Salva o rascunho completo (validado). Não afeta a versão publicada. */
export async function saveCampaignConfig(id: string, rawConfig: unknown) {
  const config = campaignConfigSchema.parse(rawConfig);
  const [row] = await db
    .update(campaigns)
    .set({ config })
    .where(eq(campaigns.id, id))
    .returning({ id: campaigns.id, updatedAt: campaigns.updatedAt });
  if (!row) throw new Error("Campanha não encontrada.");
  return { ...row, config };
}

/** Atualiza só uma seção do rascunho (quiz, perfis, regras, ...). */
export async function saveCampaignSection<K extends keyof CampaignConfig>(id: string, key: K, value: unknown) {
  return saveCampaignSections(id, { [key]: value });
}

/** Atualiza várias seções de forma atômica (ex.: perfis + regras, que dependem entre si). */
export async function saveCampaignSections(id: string, patch: Partial<Record<keyof CampaignConfig, unknown>>) {
  const current = await getCampaign(id);
  if (!current) throw new Error("Campanha não encontrada.");
  return saveCampaignConfig(id, { ...current.config, ...patch });
}

export async function publishCampaign(id: string) {
  const current = await getCampaign(id);
  if (!current) throw new Error("Campanha não encontrada.");
  const issues = publishIssues(current.config);
  if (issues.length) return { ok: false as const, issues };
  await db
    .update(campaigns)
    .set({ status: "published", publishedConfig: current.config, publishedAt: new Date() })
    .where(eq(campaigns.id, id));
  return { ok: true as const, issues: [] };
}

export async function setCampaignStatus(id: string, status: Exclude<CampaignStatus, "published">) {
  await db.update(campaigns).set({ status }).where(eq(campaigns.id, id));
}

export async function duplicateCampaign(id: string) {
  const current = await getCampaign(id);
  if (!current) throw new Error("Campanha não encontrada.");
  const slug = await uniqueSlug(`${current.slug}-copia`);
  const [row] = await db
    .insert(campaigns)
    .values({
      name: `${current.name} (cópia)`,
      description: current.description,
      slug,
      productId: current.productId,
      config: structuredClone(current.config),
      status: "draft",
    })
    .returning();
  return row;
}

/** Exclusão definitiva: remove também sessões, eventos e leads da campanha (cascade). */
export async function deleteCampaign(id: string) {
  await db.delete(campaigns).where(eq(campaigns.id, id));
}

export async function saveCampaignAsTemplate(id: string, input: { name: string; description?: string; category?: string }) {
  const current = await getCampaign(id);
  if (!current) throw new Error("Campanha não encontrada.");
  const name = z.string().trim().min(2, "Informe o nome do modelo").max(200).parse(input.name);
  const [row] = await db
    .insert(templates)
    .values({
      name,
      description: (input.description ?? "").slice(0, 1000),
      category: (input.category ?? "").slice(0, 100),
      config: structuredClone(current.config),
    })
    .returning();
  return row;
}

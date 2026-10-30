import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { templates } from "@/lib/db/schema";
import { campaignConfigSchema } from "@/lib/domain/config";
import { builtinTemplates } from "@/lib/templates/builtin";

export async function listTemplates() {
  return db.select().from(templates).orderBy(desc(templates.isBuiltin), desc(templates.createdAt));
}

export async function deleteTemplate(id: string) {
  const [row] = await db.select({ isBuiltin: templates.isBuiltin }).from(templates).where(eq(templates.id, id));
  if (row?.isBuiltin) throw new Error("Modelos embutidos não podem ser excluídos.");
  await db.delete(templates).where(eq(templates.id, id));
}

/** Instala/atualiza os modelos embutidos (idempotente). */
export async function installBuiltinTemplates() {
  for (const t of builtinTemplates) {
    const config = campaignConfigSchema.parse(t.config);
    await db
      .insert(templates)
      .values({ key: t.key, name: t.name, description: t.description, category: t.category, config, isBuiltin: true })
      .onConflictDoUpdate({
        target: templates.key,
        set: { name: t.name, description: t.description, category: t.category, config },
      });
  }
  return builtinTemplates.length;
}

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { trackingSchema } from "@/lib/domain/config";

const httpsUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || /^https:\/\//i.test(v), "Use uma URL https://");

export const settingSchemas = {
  tracking: trackingSchema,
  privacy: z.object({
    controllerName: z.string().trim().max(200).default(""),
    contactEmail: z.union([z.literal(""), z.string().trim().email("E-mail inválido")]).default(""),
    policyText: z.string().trim().max(30000).default(""),
  }),
  outgoingWebhook: z.object({
    url: httpsUrl.default(""),
    secret: z.string().max(200).default(""),
    events: z.array(z.enum(["lead_captured", "purchase_confirmed"])).default(["lead_captured", "purchase_confirmed"]),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type SettingValue<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;

export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const parsed = settingSchemas[key].safeParse(row?.value ?? {});
  return (parsed.success ? parsed.data : settingSchemas[key].parse({})) as SettingValue<K>;
}

export async function setSetting<K extends SettingKey>(key: K, value: unknown): Promise<SettingValue<K>> {
  const data = settingSchemas[key].parse(value) as SettingValue<K>;
  await db
    .insert(settings)
    .values({ key, value: data })
    .onConflictDoUpdate({ target: settings.key, set: { value: data, updatedAt: new Date() } });
  return data;
}

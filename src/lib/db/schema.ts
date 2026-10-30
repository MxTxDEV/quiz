import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Bonus, CampaignConfig } from "@/lib/domain/config";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---------- Acesso ----------

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["owner", "editor", "viewer"] }).notNull().default("editor"),
  createdAt: createdAt(),
});

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(), // sha256(token)
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: createdAt(),
});

// ---------- Catálogo ----------

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  coverImageUrl: text("cover_image_url").notNull().default(""),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default(""),
  priceCents: integer("price_cents").notNull().default(0),
  referencePriceCents: integer("reference_price_cents"),
  referencePriceNote: text("reference_price_note").notNull().default(""),
  checkoutUrl: text("checkout_url").notNull().default(""),
  benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
  deliverables: jsonb("deliverables").$type<string[]>().notNull().default([]),
  bonuses: jsonb("bonuses").$type<Bonus[]>().notNull().default([]),
  guarantee: text("guarantee").notNull().default(""),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const campaignStatuses = ["draft", "published", "paused", "archived"] as const;
export type CampaignStatus = (typeof campaignStatuses)[number];

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    slug: text("slug").notNull(),
    status: text("status", { enum: campaignStatuses }).notNull().default("draft"),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    config: jsonb("config").$type<CampaignConfig>().notNull(),
    publishedConfig: jsonb("published_config").$type<CampaignConfig>(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("campaigns_slug_idx").on(t.slug)],
);

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: text("key").unique(), // modelos embutidos têm chave estável (idempotência do seed)
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  category: text("category").notNull().default(""),
  config: jsonb("config").$type<CampaignConfig>().notNull(),
  isBuiltin: boolean("is_builtin").notNull().default(false),
  createdAt: createdAt(),
});

// ---------- Dados de visitantes ----------

const utmColumns = () => ({
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  trafficSource: text("traffic_source").notNull().default("direct"),
  device: text("device", { enum: ["mobile", "tablet", "desktop"] }).notNull().default("desktop"),
});

export const visitorSessions = pgTable(
  "visitor_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    referrer: text("referrer"),
    ...utmColumns(),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull().default({}),
    attributes: jsonb("attributes").$type<Record<string, unknown>>().notNull().default({}),
    score: integer("score").notNull().default(0),
    profileId: text("profile_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("visitor_sessions_campaign_idx").on(t.campaignId, t.createdAt)],
);

export const eventTypes = [
  "page_view",
  "quiz_started",
  "question_answered",
  "quiz_completed",
  "result_viewed",
  "offer_viewed",
  "checkout_clicked",
  "purchase_confirmed",
  "lead_captured",
] as const;
export type EventType = (typeof eventTypes)[number];

export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => visitorSessions.id, { onDelete: "set null" }),
    visitorId: text("visitor_id"),
    type: text("type", { enum: eventTypes }).notNull(),
    questionId: text("question_id"),
    profileId: text("profile_id"),
    valueCents: integer("value_cents"),
    ...utmColumns(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index("events_campaign_type_idx").on(t.campaignId, t.type, t.createdAt),
    index("events_created_idx").on(t.createdAt),
    index("events_session_idx").on(t.sessionId),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id").references(() => visitorSessions.id, { onDelete: "set null" }),
    name: text("name"),
    email: text("email"),
    profileId: text("profile_id"),
    consent: boolean("consent").notNull().default(false),
    consentText: text("consent_text").notNull().default(""),
    consentAt: timestamp("consent_at", { withTimezone: true }),
    ipHash: text("ip_hash"),
    createdAt: createdAt(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("leads_campaign_idx").on(t.campaignId, t.createdAt), index("leads_email_idx").on(t.email)],
);

export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    sessionId: uuid("session_id").references(() => visitorSessions.id, { onDelete: "set null" }),
    provider: text("provider").notNull(), // generic | hotmart | kiwify | manual
    externalId: text("external_id").notNull(),
    status: text("status", { enum: ["confirmed", "refunded", "chargeback"] }).notNull(),
    amountCents: integer("amount_cents").notNull().default(0),
    currency: text("currency").notNull().default("BRL"),
    profileId: text("profile_id"),
    raw: jsonb("raw").$type<Record<string, unknown>>().notNull().default({}),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("purchases_provider_external_idx").on(t.provider, t.externalId),
    index("purchases_campaign_idx").on(t.campaignId, t.confirmedAt),
  ],
);

export const adSpend = pgTable(
  "ad_spend",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    amountCents: integer("amount_cents").notNull(),
    source: text("source").notNull().default("meta"),
    note: text("note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("ad_spend_campaign_idx").on(t.campaignId, t.date)],
);

// ---------- Integrações ----------

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  provider: text("provider", { enum: ["generic", "hotmart", "kiwify"] }).notNull(),
  name: text("name").notNull(),
  secret: text("secret").notNull(),
  campaignId: uuid("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
  active: boolean("active").notNull().default(true),
  lastReceivedAt: timestamp("last_received_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: updatedAt(),
});

export const errorLogs = pgTable("error_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  scope: text("scope").notNull(),
  message: text("message").notNull(),
  detail: jsonb("detail").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAt(),
});

export type User = typeof users.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type Template = typeof templates.$inferSelect;
export type VisitorSession = typeof visitorSessions.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;

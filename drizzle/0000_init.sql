CREATE TABLE "ad_spend" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"date" date NOT NULL,
	"amount_cents" integer NOT NULL,
	"source" text DEFAULT 'meta' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"slug" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"product_id" uuid,
	"config" jsonb NOT NULL,
	"published_config" jsonb,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"scope" text NOT NULL,
	"message" text NOT NULL,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"campaign_id" uuid NOT NULL,
	"session_id" uuid,
	"visitor_id" text,
	"type" text NOT NULL,
	"question_id" text,
	"profile_id" text,
	"value_cents" integer,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"traffic_source" text DEFAULT 'direct' NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"session_id" uuid,
	"name" text,
	"email" text,
	"profile_id" text,
	"consent" boolean DEFAULT false NOT NULL,
	"consent_text" text DEFAULT '' NOT NULL,
	"consent_at" timestamp with time zone,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cover_image_url" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"price_cents" integer DEFAULT 0 NOT NULL,
	"reference_price_cents" integer,
	"reference_price_note" text DEFAULT '' NOT NULL,
	"checkout_url" text DEFAULT '' NOT NULL,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"deliverables" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"bonuses" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"guarantee" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid,
	"session_id" uuid,
	"provider" text NOT NULL,
	"external_id" text NOT NULL,
	"status" text NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BRL' NOT NULL,
	"profile_id" text,
	"raw" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"config" jsonb NOT NULL,
	"is_builtin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text DEFAULT '' NOT NULL,
	"password_hash" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visitor_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"referrer" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"traffic_source" text DEFAULT 'direct' NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score" integer DEFAULT 0 NOT NULL,
	"profile_id" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"name" text NOT NULL,
	"secret" text NOT NULL,
	"campaign_id" uuid,
	"active" boolean DEFAULT true NOT NULL,
	"last_received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ad_spend" ADD CONSTRAINT "ad_spend_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_session_id_visitor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."visitor_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_session_id_visitor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."visitor_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_session_id_visitor_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."visitor_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visitor_sessions" ADD CONSTRAINT "visitor_sessions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ad_spend_campaign_idx" ON "ad_spend" USING btree ("campaign_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "campaigns_slug_idx" ON "campaigns" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_campaign_type_idx" ON "events" USING btree ("campaign_id","type","created_at");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_session_idx" ON "events" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "leads_campaign_idx" ON "leads" USING btree ("campaign_id","created_at");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "purchases_provider_external_idx" ON "purchases" USING btree ("provider","external_id");--> statement-breakpoint
CREATE INDEX "purchases_campaign_idx" ON "purchases" USING btree ("campaign_id","confirmed_at");--> statement-breakpoint
CREATE INDEX "visitor_sessions_campaign_idx" ON "visitor_sessions" USING btree ("campaign_id","created_at");
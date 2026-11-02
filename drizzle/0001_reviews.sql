CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"name" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"rating" integer NOT NULL,
	"text" text NOT NULL,
	"email" text,
	"verified" boolean DEFAULT false NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"consent_text" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reviews_campaign_idx" ON "reviews" USING btree ("campaign_id","status","created_at");
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "@/lib/db";

let migrated = false;

export async function resetDb() {
  if (!migrated) {
    await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
    migrated = true;
  }
  await sql`truncate table events, leads, purchases, ad_spend, visitor_sessions, webhook_endpoints, campaigns, templates, products, settings, error_logs, auth_sessions, users restart identity cascade`;
}

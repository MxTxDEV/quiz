import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { sql } from "@/lib/db";

let migrated = false;

export async function resetDb() {
  if (!migrated) {
    const conn = postgres(process.env.DATABASE_URL!, { max: 1 });
    await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
    await conn.end();
    migrated = true;
  }
  await sql`truncate table reviews, events, leads, purchases, ad_spend, visitor_sessions, webhook_endpoints, campaigns, templates, products, settings, error_logs, auth_sessions, users restart identity cascade`;
}

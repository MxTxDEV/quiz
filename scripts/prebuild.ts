/**
 * Executado antes do `next build`: aplica migrações e instala/atualiza os modelos prontos.
 * Sem DATABASE_URL (ex.: build local sem banco), apenas avisa e segue.
 */
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.warn("[prebuild] DATABASE_URL ausente — migrações e modelos não aplicados.");
  process.exit(0);
}

const { drizzle } = await import("drizzle-orm/postgres-js");
const { migrate } = await import("drizzle-orm/postgres-js/migrator");
const { default: postgres } = await import("postgres");

const conn = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
await migrate(drizzle(conn), { migrationsFolder: "./drizzle" });
await conn.end();
console.log("[prebuild] Migrações aplicadas.");

const { installBuiltinTemplates } = await import("@/lib/services/templates");
const { sql } = await import("@/lib/db");
const n = await installBuiltinTemplates();
await sql.end();
console.log(`[prebuild] ${n} modelos prontos instalados/atualizados.`);

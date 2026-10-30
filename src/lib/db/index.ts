import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  // reaproveita a conexão entre recarregamentos em desenvolvimento
  var __funnelosSql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  return postgres(url, {
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    prepare: false, // compatível com o pooler do Neon (PgBouncer)
  });
}

export const sql = globalThis.__funnelosSql ?? createClient();
if (process.env.NODE_ENV !== "production") globalThis.__funnelosSql = sql;

export const db = drizzle(sql, { schema });
export type DB = typeof db;
export { schema };

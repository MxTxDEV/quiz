import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Sql = ReturnType<typeof postgres>;
type Db = PostgresJsDatabase<typeof schema> & { $client: Sql };

declare global {
  // reaproveita a conexão entre recarregamentos em desenvolvimento
  var __funnelos: { sql: Sql; db: Db } | undefined;
}

/**
 * A conexão é criada na primeira consulta, não na importação: assim o `next build`
 * funciona mesmo sem DATABASE_URL disponível na etapa de build.
 */
function client() {
  if (globalThis.__funnelos) return globalThis.__funnelos;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada");
  const sql = postgres(url, {
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    idle_timeout: 20,
    prepare: false, // compatível com o pooler do Neon (PgBouncer)
  });
  globalThis.__funnelos = { sql, db: drizzle(sql, { schema }) as Db };
  return globalThis.__funnelos;
}

function lazy<T extends object>(get: () => T): T {
  return new Proxy(function () {} as unknown as T, {
    get: (_t, prop) => {
      const target = get() as Record<string | symbol, unknown>;
      const value = target[prop];
      return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(target) : value;
    },
    apply: (_t, thisArg, args) => Reflect.apply(get() as unknown as (...a: unknown[]) => unknown, thisArg, args),
  });
}

export const sql: Sql = lazy(() => client().sql);
export const db: Db = lazy(() => client().db);
export type DB = Db;
export { schema };

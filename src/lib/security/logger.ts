import { db } from "@/lib/db";
import { errorLogs } from "@/lib/db/schema";

/** Registra erro no console e no banco (sem nunca lançar). */
export async function logError(scope: string, error: unknown, detail: Record<string, unknown> = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[${scope}]`, error);
  try {
    await db.insert(errorLogs).values({
      scope,
      message: message.slice(0, 2000),
      detail: { ...detail, stack: error instanceof Error ? error.stack?.slice(0, 4000) : undefined },
    });
  } catch {
    // banco indisponível: o console já registrou
  }
}

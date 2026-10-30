import { ZodError } from "zod";
import { AuthError } from "@/lib/auth/session";
import { logError } from "@/lib/security/logger";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/** Converte exceções em respostas amigáveis para os formulários do painel. */
export async function run<T>(scope: string, fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".");
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false, error: err.issues[0]?.message ?? "Dados inválidos", fieldErrors };
    }
    if (err instanceof AuthError) return { ok: false, error: err.message };
    // erros de negócio lançados pelos serviços são exibidos; erros inesperados são registrados
    if (err instanceof Error && !(err as { code?: string }).code && err.message.length < 300) {
      return { ok: false, error: err.message };
    }
    await logError(scope, err);
    return { ok: false, error: "Erro inesperado. Tente novamente." };
  }
}

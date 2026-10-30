import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { PublicFlowError } from "@/lib/services/public-flow";
import { logError } from "@/lib/security/logger";

const MAX_BODY = 16 * 1024;

/** Envolve um handler público: rate limit por IP, leitura segura do JSON e mapeamento de erros. */
export function publicHandler(
  scope: string,
  limit: { max: number; windowMs: number },
  fn: (body: Record<string, unknown>, req: NextRequest, ip: string) => Promise<unknown>,
) {
  return async (req: NextRequest) => {
    const ip = clientIp(req.headers);
    const rl = rateLimit(`${scope}:${ip}`, limit.max, limit.windowMs);
    if (!rl.ok)
      return NextResponse.json({ error: "Muitas requisições. Aguarde um instante." }, { status: 429, headers: { "retry-after": String(rl.retryAfter) } });
    try {
      const text = await req.text();
      if (text.length > MAX_BODY) return NextResponse.json({ error: "Requisição muito grande" }, { status: 413 });
      let body: unknown = {};
      try {
        body = text ? JSON.parse(text) : {};
      } catch {
        return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
      const result = await fn(body as Record<string, unknown>, req, ip);
      return NextResponse.json(result ?? { ok: true }, { headers: { "cache-control": "no-store" } });
    } catch (err) {
      if (err instanceof PublicFlowError) return NextResponse.json({ error: err.message }, { status: err.status });
      if (err instanceof ZodError) return NextResponse.json({ error: err.issues[0]?.message ?? "Dados inválidos" }, { status: 422 });
      await logError(`api.${scope}`, err);
      return NextResponse.json({ error: "Erro interno" }, { status: 500 });
    }
  };
}

export const str = (v: unknown) => (typeof v === "string" ? v : "");

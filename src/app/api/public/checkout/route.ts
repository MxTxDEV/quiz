import { NextResponse, type NextRequest } from "next/server";
import { checkoutRedirect, PublicFlowError } from "@/lib/services/public-flow";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/security/logger";

/**
 * GET /api/public/checkout?s=<sessão>&b=<bloco>
 * Registra checkout_clicked e redireciona para o checkout externo (funciona sem JavaScript).
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req.headers);
  if (!rateLimit(`checkout:${ip}`, 30, 60_000).ok) return new NextResponse("Muitas requisições", { status: 429 });
  const sessionId = req.nextUrl.searchParams.get("s") ?? "";
  try {
    const url = await checkoutRedirect(sessionId, req.nextUrl.searchParams.get("b"));
    return NextResponse.redirect(url, { status: 303, headers: { "cache-control": "no-store" } });
  } catch (err) {
    if (err instanceof PublicFlowError) return new NextResponse(err.message, { status: err.status });
    await logError("api.checkout", err);
    return new NextResponse("Erro interno", { status: 500 });
  }
}

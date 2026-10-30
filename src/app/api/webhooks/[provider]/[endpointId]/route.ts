import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { webhookEndpoints } from "@/lib/db/schema";
import { providers, type ProviderName } from "@/lib/integrations/checkout-providers";
import { recordPurchase } from "@/lib/services/purchases";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { logError } from "@/lib/security/logger";

/**
 * Confirmação de vendas. Uma venda só é registrada depois de validar a assinatura/token do endpoint.
 * URL: /api/webhooks/<provider>/<endpointId>
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ provider: string; endpointId: string }> }) {
  const { provider, endpointId } = await params;
  if (!rateLimit(`webhook:${clientIp(req.headers)}`, 120, 60_000).ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });
  if (!(provider in providers) || !z.string().uuid().safeParse(endpointId).success) return NextResponse.json({ error: "not found" }, { status: 404 });

  const [endpoint] = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.id, endpointId)).limit(1);
  if (!endpoint || endpoint.provider !== provider || !endpoint.active) return NextResponse.json({ error: "not found" }, { status: 404 });

  const rawBody = await req.text();
  if (rawBody.length > 256 * 1024) return NextResponse.json({ error: "payload too large" }, { status: 413 });

  const parsed = providers[provider as ProviderName]({ rawBody, headers: req.headers, searchParams: req.nextUrl.searchParams, secret: endpoint.secret });
  if (!parsed.ok) {
    await logError("webhook.rejected", new Error(parsed.error), { provider, endpointId, status: parsed.status });
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  await db.update(webhookEndpoints).set({ lastReceivedAt: new Date() }).where(eq(webhookEndpoints.id, endpoint.id));
  if (!parsed.purchase) return NextResponse.json({ ok: true, ignored: true });

  try {
    let raw: Record<string, unknown> = {};
    try {
      raw = JSON.parse(rawBody);
    } catch {}
    const res = await recordPurchase(provider, parsed.purchase, { campaignId: endpoint.campaignId, raw });
    return NextResponse.json({ ok: true, created: res.created });
  } catch (err) {
    await logError("webhook.process", err, { provider, endpointId });
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Adaptadores de confirmação de venda.
 * Cada adaptador (1) valida a autenticidade da requisição e (2) normaliza o payload.
 * Os payloads brutos são guardados em `purchases.raw` para auditoria.
 *
 * Hotmart/Kiwify: mapeamentos baseados na documentação pública dos webhooks.
 * Valide com um envio de teste da plataforma antes de usar em produção.
 */

export type NormalizedPurchase = {
  externalId: string;
  status: "confirmed" | "refunded" | "chargeback";
  amountCents: number;
  currency: string;
  sessionId: string | null;
};

export type ParseResult =
  | { ok: true; purchase: NormalizedPurchase | null } // null = evento válido, mas irrelevante (ex.: boleto gerado)
  | { ok: false; status: number; error: string };

export type ProviderInput = { rawBody: string; headers: Headers; searchParams: URLSearchParams; secret: string };

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asSession = (...values: unknown[]) => {
  for (const v of values) if (typeof v === "string" && UUID.test(v)) return v.toLowerCase();
  return null;
};

const toCents = (v: unknown): number => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
};

function parseJson(raw: string): Record<string, any> | null {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : null;
  } catch {
    return null;
  }
}

/** Genérico: `x-funnelos-signature: sha256=<hex HMAC-SHA256(corpo, segredo)>` */
export function signGeneric(body: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function generic({ rawBody, headers, secret }: ProviderInput): ParseResult {
  const sig = headers.get("x-funnelos-signature") ?? "";
  if (!sig || !safeEqual(sig, signGeneric(rawBody, secret))) return { ok: false, status: 401, error: "Assinatura inválida" };
  const body = parseJson(rawBody);
  if (!body) return { ok: false, status: 400, error: "JSON inválido" };
  const map: Record<string, NormalizedPurchase["status"]> = {
    "purchase.confirmed": "confirmed",
    "purchase.refunded": "refunded",
    "purchase.chargeback": "chargeback",
  };
  const status = map[String(body.event)];
  if (!status) return { ok: true, purchase: null };
  if (typeof body.id !== "string" || !body.id) return { ok: false, status: 422, error: "Campo id obrigatório" };
  return {
    ok: true,
    purchase: {
      externalId: body.id.slice(0, 200),
      status,
      amountCents: Number.isInteger(body.amount_cents) ? body.amount_cents : 0,
      currency: typeof body.currency === "string" ? body.currency.slice(0, 3).toUpperCase() : "BRL",
      sessionId: asSession(body.session_id),
    },
  };
}

/** Hotmart (webhook 2.0): header `X-HOTMART-HOTTOK` igual ao token configurado. */
function hotmart({ rawBody, headers, secret }: ProviderInput): ParseResult {
  const token = headers.get("x-hotmart-hottok") ?? "";
  if (!token || !safeEqual(token, secret)) return { ok: false, status: 401, error: "Hottok inválido" };
  const body = parseJson(rawBody);
  if (!body) return { ok: false, status: 400, error: "JSON inválido" };
  const map: Record<string, NormalizedPurchase["status"]> = {
    PURCHASE_APPROVED: "confirmed",
    PURCHASE_COMPLETE: "confirmed",
    PURCHASE_REFUNDED: "refunded",
    PURCHASE_CHARGEBACK: "chargeback",
  };
  const status = map[String(body.event)];
  if (!status) return { ok: true, purchase: null };
  const purchase = body.data?.purchase ?? {};
  const externalId = String(purchase.transaction ?? "");
  if (!externalId) return { ok: false, status: 422, error: "Transação ausente" };
  return {
    ok: true,
    purchase: {
      externalId,
      status,
      amountCents: toCents(purchase.price?.value),
      currency: String(purchase.price?.currency_value ?? "BRL").slice(0, 3),
      sessionId: asSession(purchase.origin?.sck, purchase.origin?.src, purchase.origin?.xcod),
    },
  };
}

/** Kiwify: query `?signature=` = HMAC-SHA1(corpo, token) em hexadecimal. */
function kiwify({ rawBody, searchParams, secret }: ProviderInput): ParseResult {
  const sig = searchParams.get("signature") ?? "";
  const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
  if (!sig || !safeEqual(sig, expected)) return { ok: false, status: 401, error: "Assinatura inválida" };
  const body = parseJson(rawBody);
  if (!body) return { ok: false, status: 400, error: "JSON inválido" };
  const map: Record<string, NormalizedPurchase["status"]> = {
    paid: "confirmed",
    approved: "confirmed",
    refunded: "refunded",
    chargedback: "chargeback",
  };
  const status = map[String(body.order_status)];
  if (!status) return { ok: true, purchase: null };
  const externalId = String(body.order_id ?? "");
  if (!externalId) return { ok: false, status: 422, error: "Pedido ausente" };
  // Kiwify envia valores em centavos (inteiros) em Commissions.charge_amount
  const charge = Number(body.Commissions?.charge_amount ?? body.Commissions?.product_base_price ?? 0);
  return {
    ok: true,
    purchase: {
      externalId,
      status,
      amountCents: Number.isFinite(charge) ? Math.round(charge) : 0,
      currency: String(body.Commissions?.currency ?? "BRL").slice(0, 3),
      sessionId: asSession(body.TrackingParameters?.sck, body.TrackingParameters?.src),
    },
  };
}

export const providers = { generic, hotmart, kiwify } as const;
export type ProviderName = keyof typeof providers;
export const providerLabels: Record<ProviderName, string> = { generic: "Genérico (HMAC)", hotmart: "Hotmart", kiwify: "Kiwify" };

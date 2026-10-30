import { describe, expect, it } from "vitest";
import { deriveMetrics, questionDropoff } from "@/lib/analytics/metrics";
import { buildCheckoutUrl } from "@/lib/tracking/checkout";
import { classifySource, detectDevice, pickUtm } from "@/lib/tracking/context";
import { providers, signGeneric } from "@/lib/integrations/checkout-providers";
import { createHmac } from "node:crypto";

describe("deriveMetrics", () => {
  const base = { visitors: 200, started: 100, completed: 50, leads: 10, resultViews: 50, offerViews: 40, checkoutClicks: 20, purchases: 4, revenueCents: 40000, adSpendCents: 20000 };
  it("calcula as fórmulas do briefing", () => {
    const m = deriveMetrics(base);
    expect(m.startRate).toBe(0.5); // iniciados / visitantes
    expect(m.completionRate).toBe(0.5); // concluídos / iniciados
    expect(m.purchaseRate).toBe(0.02); // compras / visitantes únicos
    expect(m.cpaCents).toBe(5000); // investimento / compras
    expect(m.roas).toBe(2); // receita / investimento
    expect(m.revenuePerVisitorCents).toBe(200);
  });
  it("divisões por zero retornam null", () => {
    const m = deriveMetrics({ ...base, visitors: 0, started: 0, purchases: 0, adSpendCents: 0 });
    expect(m.startRate).toBeNull();
    expect(m.completionRate).toBeNull();
    expect(m.cpaCents).toBeNull();
    expect(m.roas).toBeNull();
  });
  it("cliques no checkout não entram como compra", () => {
    const m = deriveMetrics({ ...base, purchases: 0, revenueCents: 0 });
    expect(m.purchaseRate).toBe(0);
    expect(m.checkoutClickRate).toBe(0.1);
  });
});

describe("questionDropoff", () => {
  it("abandono = quem chegou e não respondeu", () => {
    const rows = questionDropoff([{ id: "a", title: "A" }, { id: "b", title: "B" }], { a: 80, b: 60 }, 100);
    expect(rows[0]).toMatchObject({ reached: 100, answered: 80, dropoff: 0.2 });
    expect(rows[1]).toMatchObject({ reached: 80, answered: 60, dropoff: 0.25 });
  });
});

describe("rastreamento", () => {
  it("dispositivo, UTM e origem", () => {
    expect(detectDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile")).toBe("mobile");
    expect(detectDevice("Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
    const utm = pickUtm({ utm_source: "Facebook", utm_campaign: "c1" });
    expect(classifySource(utm, null)).toBe("facebook");
    expect(classifySource(pickUtm({}), "https://www.google.com/search?q=x")).toBe("google");
    expect(classifySource(pickUtm({}), null, { fbclid: "x" })).toBe("facebook");
    expect(classifySource(pickUtm({}), null)).toBe("direct");
  });
  it("URL de checkout recebe sessão e UTMs sem sobrescrever parâmetros existentes", () => {
    const url = new URL(buildCheckoutUrl("https://pay.hotmart.com/X?sck=fixo", "sid-1", { utm_source: "meta" })!);
    expect(url.searchParams.get("fos_sid")).toBe("sid-1");
    expect(url.searchParams.get("sck")).toBe("fixo");
    expect(url.searchParams.get("utm_source")).toBe("meta");
    expect(buildCheckoutUrl("javascript:alert(1)", "s", {})).toBeNull();
  });
});

describe("webhooks de compra", () => {
  const sid = "6f1c1f9e-8a7b-4c1d-9e2f-0a1b2c3d4e5f";
  it("genérico valida HMAC", () => {
    const body = JSON.stringify({ event: "purchase.confirmed", id: "T1", amount_cents: 9700, session_id: sid });
    const ok = providers.generic({ rawBody: body, headers: new Headers({ "x-funnelos-signature": signGeneric(body, "s3cr3t") }), searchParams: new URLSearchParams(), secret: "s3cr3t" });
    expect(ok).toMatchObject({ ok: true, purchase: { externalId: "T1", amountCents: 9700, sessionId: sid, status: "confirmed" } });
    const bad = providers.generic({ rawBody: body, headers: new Headers({ "x-funnelos-signature": "sha256=00" }), searchParams: new URLSearchParams(), secret: "s3cr3t" });
    expect(bad.ok).toBe(false);
  });
  it("hotmart valida hottok e normaliza", () => {
    const body = JSON.stringify({ event: "PURCHASE_APPROVED", data: { purchase: { transaction: "HP1", price: { value: 97.5, currency_value: "BRL" }, origin: { sck: sid } } } });
    const r = providers.hotmart({ rawBody: body, headers: new Headers({ "x-hotmart-hottok": "tok" }), searchParams: new URLSearchParams(), secret: "tok" });
    expect(r).toMatchObject({ ok: true, purchase: { externalId: "HP1", amountCents: 9750, sessionId: sid } });
    expect(providers.hotmart({ rawBody: body, headers: new Headers(), searchParams: new URLSearchParams(), secret: "tok" }).ok).toBe(false);
  });
  it("kiwify valida assinatura e ignora eventos não financeiros", () => {
    const body = JSON.stringify({ order_id: "K1", order_status: "waiting_payment" });
    const signature = createHmac("sha1", "kt").update(body).digest("hex");
    expect(providers.kiwify({ rawBody: body, headers: new Headers(), searchParams: new URLSearchParams({ signature }), secret: "kt" })).toEqual({ ok: true, purchase: null });
  });
});

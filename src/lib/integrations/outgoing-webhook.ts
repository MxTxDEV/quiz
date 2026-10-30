import { createHmac } from "node:crypto";
import { getSetting } from "@/lib/services/settings";
import { logError } from "@/lib/security/logger";

/**
 * Webhook de saída (ex.: CRM/automação de e-mail do próprio administrador).
 * Assinatura: header `x-funnelos-signature: sha256=<hmac do corpo>`.
 * Nunca deve ser apontado para plataformas de anúncio — contém nome/e-mail do lead.
 */
export async function dispatchOutgoing(event: "lead_captured" | "purchase_confirmed", payload: Record<string, unknown>) {
  try {
    const cfg = await getSetting("outgoingWebhook");
    if (!cfg.url || !cfg.events.includes(event)) return;
    const body = JSON.stringify({ event, sentAt: new Date().toISOString(), data: payload });
    const headers: Record<string, string> = { "content-type": "application/json", "user-agent": "FunnelOS-Webhook/1" };
    if (cfg.secret) headers["x-funnelos-signature"] = `sha256=${createHmac("sha256", cfg.secret).update(body).digest("hex")}`;
    const res = await fetch(cfg.url, { method: "POST", headers, body, signal: AbortSignal.timeout(5000) });
    if (!res.ok) await logError("outgoing-webhook", new Error(`HTTP ${res.status}`), { event });
  } catch (err) {
    await logError("outgoing-webhook", err, { event });
  }
}

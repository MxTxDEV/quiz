/**
 * Eventos para ferramentas de terceiros (Meta Pixel, GA4, GTM).
 * Nunca enviar nome, e-mail, respostas abertas ou qualquer dado pessoal.
 */
type W = Window & {
  fbq?: (...args: unknown[]) => void;
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
};

const metaMap: Record<string, string | null> = {
  quiz_started: "StartQuiz",
  quiz_completed: "CompleteRegistration",
  lead_captured: "Lead",
  offer_viewed: "ViewContent",
  checkout_clicked: "InitiateCheckout",
};
const standardMeta = new Set(["Lead", "ViewContent", "InitiateCheckout", "CompleteRegistration"]);

export function trackThirdParty(event: string, params: { profile?: string | null; value?: number; currency?: string } = {}) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const safe: Record<string, unknown> = {};
  if (params.profile) safe.content_category = params.profile;
  if (params.value != null) {
    safe.value = params.value;
    safe.currency = params.currency ?? "BRL";
  }
  try {
    const meta = metaMap[event];
    if (meta && w.fbq) standardMeta.has(meta) ? w.fbq("track", meta, safe) : w.fbq("trackCustom", meta, safe);
    w.gtag?.("event", event, safe);
    w.dataLayer?.push({ event: `funnelos_${event}`, ...safe });
  } catch {
    // ferramentas de terceiros nunca podem quebrar o quiz
  }
}

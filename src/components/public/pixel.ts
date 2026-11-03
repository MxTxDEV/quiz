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
  sales_page_view: "ViewContent",
  offer_viewed: "ViewOffer",
  purchase_button_click: "InitiateCheckout",
};
const standardMeta = new Set(["Lead", "ViewContent", "InitiateCheckout", "CompleteRegistration"]);

// Eventos disparados antes de o Pixel/GA terminarem de carregar ficam numa fila e são enviados assim que
// eles existirem (antes, eram descartados em silêncio — ex.: ViewContent ao abrir a página).
const pending: { event: string; params: Parameters<typeof trackThirdParty>[1] }[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let tries = 0;

function flush() {
  flushTimer = null;
  const w = window as W;
  if (!w.fbq && !w.gtag && !w.dataLayer && tries++ < 40) {
    flushTimer = setTimeout(flush, 250); // até ~10 s esperando os scripts
    return;
  }
  for (const item of pending.splice(0)) send(item.event, item.params);
}

function send(event: string, params: { profile?: string | null; value?: number; currency?: string } = {}) {
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

/** Eventos que só fazem sentido uma vez por visita (não duplicar ao recarregar ou clicar de novo). */
const ONCE = new Set(["quiz_started", "quiz_completed", "sales_page_view", "offer_viewed", "purchase_button_click"]);

export function trackThirdParty(event: string, params: { profile?: string | null; value?: number; currency?: string } = {}) {
  if (typeof window === "undefined") return;
  if (ONCE.has(event)) {
    try {
      const k = `fos_ev_${event}_${location.pathname}`;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, "1");
    } catch {
      // sem sessionStorage (modo privado): segue sem a proteção
    }
  }
  const w = window as W;
  if (w.fbq || w.gtag || w.dataLayer) return send(event, params);
  pending.push({ event, params });
  if (!flushTimer) flushTimer = setTimeout(flush, 250);
}

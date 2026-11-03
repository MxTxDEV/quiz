"use client";

import { useEffect } from "react";
import { trackThirdParty } from "./pixel";

type Ev = "sales_page_view" | "personalized_content_view" | "offer_viewed" | "purchase_button_click";

function sendEvent(sessionId: string, type: Ev, blockId?: string) {
  const body = JSON.stringify({ sessionId, type, blockId });
  // sendBeacon sobrevive à navegação para o checkout
  if (type === "purchase_button_click" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/public/event", new Blob([body], { type: "application/json" }));
    return;
  }
  void fetch("/api/public/event", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => undefined);
}

/**
 * Eventos da página de vendas registrados apenas quando de fato vistos (evita contar prefetch):
 * sales_page_view (carregou), personalized_content_view e offer_viewed (seção entrou na tela),
 * purchase_button_click (clique em botão de compra). O redirecionamento ao checkout
 * (checkout_redirect) é registrado pelo servidor. Nenhum desses eventos é uma venda.
 */
function visitorId(): string {
  try {
    let id = localStorage.getItem("fos_vid");
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem("fos_vid", id);
    }
    return id;
  } catch {
    return crypto.randomUUID().replace(/-/g, "");
  }
}

/**
 * Visita direta à página de vendas (sem quiz): cria a sessão com UTMs e origem — uma por aba, para
 * recarregar não contar outra visita — e troca os links de compra pela rota de checkout com sessão.
 */
async function directSession(campaignId: string): Promise<string | null> {
  const key = `fos_sid_direct_${campaignId}`;
  try {
    const saved = sessionStorage.getItem(key);
    if (saved && /^[0-9a-f-]{36}$/.test(saved)) return saved;
  } catch {
    // ignora
  }
  const params: Record<string, string> = {};
  new URLSearchParams(location.search).forEach((v, k) => {
    if (/^(utm_|fbclid$|gclid$|ttclid$)/.test(k)) params[k] = v.slice(0, 500);
  });
  try {
    const res = await fetch("/api/public/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campaignId, visitorId: visitorId(), params, referrer: document.referrer || null }),
    });
    if (!res.ok) return null;
    const { sessionId } = (await res.json()) as { sessionId: string };
    try {
      sessionStorage.setItem(key, sessionId);
    } catch {
      // ignora
    }
    return sessionId;
  } catch {
    return null;
  }
}

function upgradeBuyLinks(sid: string) {
  document.querySelectorAll<HTMLAnchorElement>("a[data-purchase]").forEach((a) => {
    const m = a.href.match(/#fos_b=([^&]+)/);
    if (!m) return;
    a.href = `/api/public/checkout?s=${sid}&b=${m[1]}`;
  });
}

export function SalesTracker({ sessionId: initialSession, campaignId, profile, value }: { sessionId: string | null; campaignId?: string; profile: string | null; value: number }) {
  useEffect(() => {
    let sessionId = initialSession;
    let cancelled = false;
    const ready: Promise<string | null> = sessionId ? Promise.resolve(sessionId) : campaignId ? directSession(campaignId) : Promise.resolve(null);
    const send = (sid: string | null, type: Ev, blockId?: string) => {
      if (sid) sendEvent(sid, type, blockId);
      else void ready.then((s) => s && !cancelled && sendEvent(s, type, blockId));
    };
    void ready.then((s) => {
      if (s && !cancelled) {
        sessionId = s;
        if (!initialSession) upgradeBuyLinks(s);
      }
    });

    trackThirdParty("sales_page_view", { profile, value });
    send(sessionId, "sales_page_view");

    const seen = new Set<string>();
    const observe = (selector: string, type: Ev, pixel?: string) => {
      const els = document.querySelectorAll(selector);
      if (!els.length) return null;
      const io = new IntersectionObserver(
        (entries) => {
          if (seen.has(type) || !entries.some((e) => e.isIntersecting)) return;
          seen.add(type);
          if (pixel) trackThirdParty(pixel, { profile, value });
          send(sessionId, type);
          io.disconnect();
        },
        { threshold: 0.35 },
      );
      els.forEach((el) => io.observe(el));
      return io;
    };
    const io1 = observe("[data-block='personalized']", "personalized_content_view");
    const io2 = observe("[data-offer]", "offer_viewed", "offer_viewed");
    // páginas sem seção de oferta: considera a oferta vista ao carregar
    if (!io2) {
      trackThirdParty("offer_viewed", { profile, value });
      send(sessionId, "offer_viewed");
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-purchase]");
      if (!a) return;
      trackThirdParty("purchase_button_click", { profile, value }); // → InitiateCheckout no Meta
      const blockId = new URL(a.href, location.href).searchParams.get("b") ?? a.href.match(/#fos_b=([^&]+)/)?.[1] ?? undefined;
      send(sessionId, "purchase_button_click", blockId);
      // dá ~200 ms para o Pixel enviar o InitiateCheckout antes de sair para o checkout
      // (antes, a navegação imediata podia cancelar o envio). Ctrl/Cmd+clique segue normal.
      if (e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.target !== "_blank") {
        e.preventDefault();
        const started = Date.now();
        // visita direta: espera a sessão (até ~0,9 s) para levar UTMs e sck ao checkout; se falhar, vai direto
        const timeout = new Promise<null>((r) => setTimeout(() => r(null), 900));
        void Promise.race([ready, timeout]).then((sid) => {
          if (sid && /#fos_b=/.test(a.href)) upgradeBuyLinks(sid);
          const href = a.href.replace(/#fos_b=.*$/, "");
          setTimeout(() => location.assign(href), Math.max(0, 220 - (Date.now() - started)));
        });
      }
    };
    document.addEventListener("click", onClick);
    return () => {
      cancelled = true;
      io1?.disconnect();
      io2?.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, [initialSession, campaignId, profile, value]);
  return null;
}

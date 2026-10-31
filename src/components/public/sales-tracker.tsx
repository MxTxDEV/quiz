"use client";

import { useEffect } from "react";
import { trackThirdParty } from "./pixel";

type Ev = "sales_page_view" | "personalized_content_view" | "offer_viewed" | "purchase_button_click";

function send(sessionId: string, type: Ev, blockId?: string) {
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
export function SalesTracker({ sessionId, profile, value }: { sessionId: string | null; profile: string | null; value: number }) {
  useEffect(() => {
    trackThirdParty("sales_page_view", { profile, value });
    if (sessionId) send(sessionId, "sales_page_view");

    const seen = new Set<string>();
    const observe = (selector: string, type: Ev, pixel?: string) => {
      const els = document.querySelectorAll(selector);
      if (!els.length) return null;
      const io = new IntersectionObserver(
        (entries) => {
          if (seen.has(type) || !entries.some((e) => e.isIntersecting)) return;
          seen.add(type);
          if (pixel) trackThirdParty(pixel, { profile, value });
          if (sessionId) send(sessionId, type);
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
      if (sessionId) send(sessionId, "offer_viewed");
    }

    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[data-purchase]");
      if (!a) return;
      trackThirdParty("purchase_button_click", { profile, value });
      const blockId = new URL(a.href, location.href).searchParams.get("b") ?? undefined;
      if (sessionId) send(sessionId, "purchase_button_click", blockId);
    };
    document.addEventListener("click", onClick);
    return () => {
      io1?.disconnect();
      io2?.disconnect();
      document.removeEventListener("click", onClick);
    };
  }, [sessionId, profile, value]);
  return null;
}

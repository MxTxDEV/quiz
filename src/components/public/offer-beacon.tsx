"use client";

import { useEffect } from "react";
import { trackThirdParty } from "./pixel";

/** Registra offer_viewed apenas quando a página é de fato exibida (evita contar prefetch). */
export function OfferBeacon({ sessionId, profile, value }: { sessionId: string | null; profile: string | null; value: number }) {
  useEffect(() => {
    trackThirdParty("offer_viewed", { profile, value });
    if (!sessionId) return;
    void fetch("/api/public/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, type: "offer_viewed" }),
      keepalive: true,
    }).catch(() => undefined);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href*='/api/public/checkout']");
      if (a) trackThirdParty("checkout_clicked", { profile, value });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [sessionId, profile, value]);
  return null;
}

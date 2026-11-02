"use client";

import { useEffect } from "react";

/**
 * Motor de movimento da página de vendas — um único listener de scroll, sem bibliotecas.
 * - publica a posição do scroll em --sy (px) no elemento raiz da página; o CSS transforma isso em paralaxe;
 * - revela cada seção quando ela entra na tela (IntersectionObserver);
 * - não faz nada quando o aparelho pede "reduzir movimento".
 */
export function SalesFx({ rootId }: { rootId: string }) {
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    root.classList.add("fx-on");

    let raf = 0;
    const update = () => {
      raf = 0;
      root.style.setProperty("--sy", String(Math.round(window.scrollY)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) {
            e.target.setAttribute("data-in", "");
            io.unobserve(e.target);
          }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
    );
    root.querySelectorAll("[data-block]").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      root.classList.remove("fx-on");
    };
  }, [rootId]);
  return null;
}

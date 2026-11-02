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

    // --sy vai só nos elementos que se movem (fundo e topo): mudar uma variável no elemento raiz
    // obrigaria o navegador a recalcular o estilo da página inteira a cada quadro
    const targets = Array.from(root.querySelectorAll<HTMLElement>(".fx-backdrop, [data-block]:first-of-type"));
    let raf = 0;
    let lastHero = -1;
    const update = () => {
      raf = 0;
      const y = Math.round(window.scrollY);
      for (const el of targets) {
        if (el.matches("[data-block]")) {
          const v = Math.min(y, 900); // o topo para de reagir depois que sai da tela
          if (v === lastHero) continue;
          lastHero = v;
          el.style.setProperty("--sy", String(v));
        } else el.style.setProperty("--sy", String(y));
      }
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

    // pausa as animações das seções que saíram da tela
    const vis = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-off", !e.isIntersecting);
      },
      { rootMargin: "120px 0px" },
    );
    root.querySelectorAll("[data-block]").forEach((el) => vis.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      vis.disconnect();
      root.classList.remove("fx-on");
    };
  }, [rootId]);
  return null;
}

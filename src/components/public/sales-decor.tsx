/**
 * Camada visual da página de vendas: fundo líquido, objetos flutuantes, orbe "metaball" e onda líquida.
 * Tudo é SVG/CSS puro (sem imagens nem bibliotecas) e anima só transform/opacity — leve no celular.
 * O movimento ligado ao scroll vem da variável --sy publicada por <SalesFx />; sem JavaScript, fica estático.
 */
import type React from "react";

type FloaterKind = "coin" | "pin" | "compass" | "spark" | "route" | "ring";

/** posição em % da tela, tamanho em px, --spd = intensidade da paralaxe, --rot = giro conforme o scroll */
const FLOATERS: { kind: FloaterKind; style: React.CSSProperties; className?: string }[] = [
  { kind: "coin", style: { left: "5%", top: "16%", width: 58, "--spd": 1.1, "--rot": 0.05, "--dur": "9s" } as React.CSSProperties },
  { kind: "pin", style: { right: "6%", top: "24%", width: 46, "--spd": 0.7, "--rot": -0.03, "--dur": "11s" } as React.CSSProperties },
  { kind: "spark", style: { left: "4%", top: "58%", width: 30, "--spd": 1.6, "--rot": 0.12, "--dur": "7s" } as React.CSSProperties },
  { kind: "compass", style: { right: "4%", top: "66%", width: 64, "--spd": 0.9, "--rot": 0.04, "--dur": "13s" } as React.CSSProperties, className: "max-sm:hidden" },
  { kind: "route", style: { left: "2%", top: "84%", width: 90, "--spd": 0.5, "--rot": -0.02, "--dur": "15s" } as React.CSSProperties, className: "max-sm:hidden" },
  { kind: "ring", style: { right: "14%", top: "8%", width: 26, "--spd": 1.9, "--rot": 0.1, "--dur": "8s" } as React.CSSProperties },
  { kind: "spark", style: { right: "20%", top: "88%", width: 22, "--spd": 2.2, "--rot": -0.14, "--dur": "6s" } as React.CSSProperties, className: "max-sm:hidden" },
];

function FloaterSvg({ kind }: { kind: FloaterKind }) {
  switch (kind) {
    case "coin":
      return (
        <svg viewBox="0 0 64 64">
          <defs>
            <radialGradient id="fx-coin" cx="35%" cy="30%" r="75%">
              <stop offset="0" stopColor="#ffd2a8" />
              <stop offset=".45" stopColor="var(--q-accent)" />
              <stop offset="1" stopColor="color-mix(in srgb, var(--q-accent) 55%, #000)" />
            </radialGradient>
          </defs>
          <circle cx="32" cy="32" r="29" fill="url(#fx-coin)" />
          <circle cx="32" cy="32" r="21" fill="none" stroke="rgba(255,255,255,.45)" strokeWidth="2" strokeDasharray="3 4" />
          <path d="M32 18c-6 0-10 4.6-10 10.2C22 36 32 46 32 46s10-10 10-17.8C42 22.6 38 18 32 18Zm0 14a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" fill="rgba(10,10,11,.75)" />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 48 64">
          <defs>
            <linearGradient id="fx-pin" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#ffb071" />
              <stop offset="1" stopColor="var(--q-accent)" />
            </linearGradient>
          </defs>
          <path d="M24 2C12 2 3 11 3 23c0 16 21 39 21 39s21-23 21-39C45 11 36 2 24 2Z" fill="url(#fx-pin)" />
          <circle cx="24" cy="23" r="8" fill="rgba(10,10,11,.8)" />
          <ellipse cx="17" cy="13" rx="6" ry="3.5" fill="rgba(255,255,255,.35)" transform="rotate(-30 17 13)" />
        </svg>
      );
    case "compass":
      return (
        <svg viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="29" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.22)" strokeWidth="2" />
          <circle cx="32" cy="32" r="22" fill="none" stroke="color-mix(in srgb, var(--q-accent) 55%, transparent)" strokeWidth="1.5" strokeDasharray="2 5" />
          <path d="M32 10 38 32H26Z" fill="var(--q-accent)" />
          <path d="M32 54 38 32H26Z" fill="rgba(255,255,255,.35)" />
          <circle cx="32" cy="32" r="4" fill="#fff" />
        </svg>
      );
    case "spark":
      return (
        <svg viewBox="0 0 32 32">
          <path d="M16 0c1.2 8 3 11 16 16-13 5-14.8 8-16 16-1.2-8-3-11-16-16C13 11 14.8 8 16 0Z" fill="var(--q-accent)" />
        </svg>
      );
    case "route":
      return (
        <svg viewBox="0 0 120 60" fill="none">
          <path d="M4 52C30 50 30 20 58 22s38-14 58-18" stroke="var(--q-accent)" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="7 7" />
          <circle cx="58" cy="22" r="5" fill="var(--q-accent)" />
          <circle cx="58" cy="22" r="11" stroke="color-mix(in srgb, var(--q-accent) 45%, transparent)" strokeWidth="2" />
        </svg>
      );
    case "ring":
      return (
        <svg viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="12" stroke="var(--q-accent)" strokeWidth="4" />
        </svg>
      );
  }
}

/** Fundo líquido (manchas de luz que ondulam) + objetos flutuantes. Fica atrás do conteúdo. */
export function SalesBackdrop() {
  return (
    <div aria-hidden className="fx-backdrop pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="fx-blob fx-blob-a" />
      <div className="fx-blob fx-blob-b" />
      <div className="fx-blob fx-blob-c" />
      {FLOATERS.map((f, i) => (
        <div key={i} className={`fx-floater ${"left" in f.style ? "fx-l" : "fx-r"} ${f.className ?? ""}`} style={f.style}>
          <div className="fx-floater-inner">
            <FloaterSvg kind={f.kind} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Orbe líquido (metaballs) atrás do livro do topo. */
export function LiquidOrb() {
  return (
    <svg aria-hidden className="fx-orb pointer-events-none absolute inset-[4%] h-[92%] w-[92%]" viewBox="0 0 400 400">
      <defs>
        <filter id="fx-goo" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9" />
        </filter>
        <radialGradient id="fx-orb-fill" cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="color-mix(in srgb, var(--q-accent) 70%, #fff)" stopOpacity=".55" />
          <stop offset="1" stopColor="var(--q-accent)" stopOpacity=".18" />
        </radialGradient>
      </defs>
      <g filter="url(#fx-goo)" fill="url(#fx-orb-fill)">
        <circle className="fx-goo fx-goo-1" cx="200" cy="200" r="92" />
        <circle className="fx-goo fx-goo-2" cx="200" cy="200" r="58" />
        <circle className="fx-goo fx-goo-3" cx="200" cy="200" r="46" />
        <circle className="fx-goo fx-goo-4" cx="200" cy="200" r="38" />
      </g>
    </svg>
  );
}

/** Onda líquida que separa o topo do resto da página. */
export function LiquidWave() {
  const wave = "M0 40 C 150 10, 300 70, 450 40 S 750 10, 900 40 S 1200 70, 1350 40 S 1650 10, 1800 40 V80 H0Z";
  return (
    <div aria-hidden className="pointer-events-none relative -mb-px h-14 overflow-hidden sm:h-20">
      <svg className="fx-wave fx-wave-back absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 1800 80" preserveAspectRatio="none">
        <path d={wave} fill="color-mix(in srgb, var(--q-accent) 10%, transparent)" />
      </svg>
      <svg className="fx-wave absolute bottom-0 left-0 h-full w-[200%]" viewBox="0 0 1800 80" preserveAspectRatio="none">
        <path d={wave} fill="color-mix(in srgb, var(--q-accent) 18%, transparent)" transform="translate(0 8)" />
      </svg>
    </div>
  );
}

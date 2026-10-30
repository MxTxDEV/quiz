import type { CSSProperties } from "react";
import type { Theme } from "@/lib/domain/config";

export const fontStacks: Record<Theme["font"], string> = {
  inter: 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  rounded: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", system-ui, sans-serif',
  serif: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
};

export const spacingScale: Record<Theme["spacing"], number> = { compact: 0.75, normal: 1, relaxed: 1.3 };

/** Variáveis CSS consumidas pelos renderizadores públicos. */
export function themeVars(t: Theme): CSSProperties {
  return {
    "--q-bg": t.background,
    "--q-surface": t.surface,
    "--q-text": t.text,
    "--q-muted": t.muted,
    "--q-accent": t.accent,
    "--q-accent-text": t.accentText,
    "--q-radius": `${t.radius}px`,
    "--q-space": String(spacingScale[t.spacing]),
    fontFamily: fontStacks[t.font],
    fontSize: `${t.baseFontSize}px`,
    background: t.background,
    color: t.text,
  } as CSSProperties;
}

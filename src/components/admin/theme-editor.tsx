"use client";

import { Field, Input, Select } from "@/components/ui/input";
import type { Theme } from "@/lib/domain/config";

const colorFields: { key: keyof Theme; label: string }[] = [
  { key: "background", label: "Fundo" },
  { key: "surface", label: "Superfície (cartões)" },
  { key: "text", label: "Texto" },
  { key: "muted", label: "Texto secundário" },
  { key: "accent", label: "Destaque / botões" },
  { key: "accentText", label: "Texto do botão" },
];

export function ThemeEditor({ value, onChange }: { value: Theme; onChange: (t: Theme) => void }) {
  const set = <K extends keyof Theme>(k: K, v: Theme[K]) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {colorFields.map((c) => (
          <Field key={c.key} label={c.label}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value[c.key] as string}
                onChange={(e) => set(c.key, e.target.value as never)}
                className="h-9 w-10 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1"
                aria-label={c.label}
              />
              <Input
                value={value[c.key] as string}
                onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set(c.key, e.target.value as never)}
                className="font-mono text-xs"
              />
            </div>
          </Field>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Tipografia">
          <Select value={value.font} onChange={(e) => set("font", e.target.value as Theme["font"])}>
            <option value="inter">Moderna (sans)</option>
            <option value="system">Sistema</option>
            <option value="rounded">Arredondada</option>
            <option value="serif">Serifada</option>
          </Select>
        </Field>
        <Field label="Tamanho do texto">
          <Select value={value.baseFontSize} onChange={(e) => set("baseFontSize", Number(e.target.value))}>
            {[14, 15, 16, 17, 18, 20].map((n) => <option key={n} value={n}>{n}px</option>)}
          </Select>
        </Field>
        <Field label="Bordas (raio)">
          <Select value={value.radius} onChange={(e) => set("radius", Number(e.target.value))}>
            {[0, 4, 8, 12, 16, 24].map((n) => <option key={n} value={n}>{n}px</option>)}
          </Select>
        </Field>
        <Field label="Espaçamento">
          <Select value={value.spacing} onChange={(e) => set("spacing", e.target.value as Theme["spacing"])}>
            <option value="compact">Compacto</option>
            <option value="normal">Normal</option>
            <option value="relaxed">Amplo</option>
          </Select>
        </Field>
      </div>
    </div>
  );
}

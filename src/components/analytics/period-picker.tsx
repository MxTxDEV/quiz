"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const options = [
  { key: "today", label: "Hoje" },
  { key: "7d", label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "90d", label: "90 dias" },
];

export function PeriodPicker({ current, from, to }: { current: string; from: string; to: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [custom, setCustom] = useState(current === "custom");
  const [range, setRange] = useState({ from, to });

  const go = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) (v === null ? p.delete(k) : p.set(k, v));
    router.push(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-md border bg-card p-0.5">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => {
              setCustom(false);
              go({ period: o.key, from: null, to: null });
            }}
            className={cn(
              "px-2.5 py-1 text-[13px] rounded-sm cursor-pointer",
              current === o.key ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
        <button
          onClick={() => setCustom(true)}
          className={cn("px-2.5 py-1 text-[13px] rounded-sm cursor-pointer", current === "custom" || custom ? "bg-muted font-medium" : "text-muted-foreground")}
        >
          Personalizado
        </button>
      </div>
      {custom && (
        <div className="flex items-center gap-1.5">
          <Input type="date" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} className="h-8 w-36" />
          <span className="text-muted-foreground text-xs">até</span>
          <Input type="date" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} className="h-8 w-36" />
          <Button size="sm" variant="outline" onClick={() => go({ period: "custom", from: range.from, to: range.to })}>
            Aplicar
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export function StringListEditor({
  value,
  onChange,
  placeholder,
  addLabel = "Adicionar item",
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="flex gap-2">
          <Input value={item} placeholder={placeholder} onChange={(e) => onChange(value.map((v, j) => (j === i ? e.target.value : v)))} />
          <Button type="button" variant="ghost" size="icon" aria-label="Remover" onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Trash2 className="text-muted-foreground" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

type Pair = Record<string, string>;

/** Editor de lista de objetos com campos de texto (bônus, FAQ, depoimentos...). */
export function ObjectListEditor<T extends Pair>({
  value,
  onChange,
  fields,
  empty,
  addLabel = "Adicionar",
}: {
  value: T[];
  onChange: (v: T[]) => void;
  fields: { key: keyof T & string; label: string; multiline?: boolean }[];
  empty: T;
  addLabel?: string;
}) {
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="rounded-md border bg-muted/30 p-3 space-y-2">
          {fields.map((f) =>
            f.multiline ? (
              <Textarea
                key={f.key}
                rows={2}
                placeholder={f.label}
                value={item[f.key] ?? ""}
                onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, [f.key]: e.target.value } : v)))}
              />
            ) : (
              <Input
                key={f.key}
                placeholder={f.label}
                value={item[f.key] ?? ""}
                onChange={(e) => onChange(value.map((v, j) => (j === i ? { ...v, [f.key]: e.target.value } : v)))}
              />
            ),
          )}
          <div className="flex justify-end">
            <Button type="button" variant="danger-ghost" size="xs" onClick={() => onChange(value.filter((_, j) => j !== i))}>
              <Trash2 /> Remover
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...empty }])}>
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

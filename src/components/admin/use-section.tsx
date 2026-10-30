"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { saveSectionsAction } from "@/app/(admin)/campaigns/actions";
import type { CampaignConfig } from "@/lib/domain/config";

/** Estado local de uma ou mais seções da configuração, com salvamento explícito (⌘/Ctrl+S). */
export function useSections<T extends Partial<CampaignConfig>>(campaignId: string, initial: T) {
  const router = useRouter();
  const [value, setValue] = useState<T>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(value) !== saved;
  const ref = useRef(value);
  ref.current = value;

  const save = useCallback(() => {
    start(async () => {
      const snapshot = ref.current;
      const res = await saveSectionsAction(campaignId, snapshot);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      setSaved(JSON.stringify(snapshot));
      toast.success("Alterações salvas no rascunho");
      router.refresh();
    });
  }, [campaignId, router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [save, dirty]);

  return { value, setValue, dirty, pending, save, errors };
}

export function useSection<K extends keyof CampaignConfig>(campaignId: string, key: K, initial: CampaignConfig[K]) {
  const s = useSections(campaignId, { [key]: initial } as Pick<CampaignConfig, K>);
  return {
    ...s,
    value: s.value[key],
    setValue: (v: CampaignConfig[K]) => s.setValue({ [key]: v } as Pick<CampaignConfig, K>),
  };
}

export function SaveBar({ dirty, pending, onSave, disabled }: { dirty: boolean; pending: boolean; onSave: () => void; disabled?: boolean }) {
  return (
    <div className="sticky bottom-4 z-20 mt-6 flex justify-end pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-3 rounded-lg border bg-card/95 backdrop-blur px-3 py-2 shadow-lg">
        <span className="text-xs text-muted-foreground">
          {disabled ? "Somente leitura" : dirty ? "Alterações não salvas" : "Tudo salvo"}
        </span>
        <Button size="sm" onClick={onSave} loading={pending} disabled={!dirty || disabled}>
          Salvar <kbd className="hidden sm:inline text-[10px] opacity-60">⌘S</kbd>
        </Button>
      </div>
    </div>
  );
}

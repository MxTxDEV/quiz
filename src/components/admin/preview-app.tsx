"use client";

import { useMemo, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { QuizRunner } from "@/components/public/quiz-runner";
import { SalesPageView } from "@/components/public/sales-page";
import { createPreviewDriver } from "@/components/admin/preview-driver";
import { toPublicCampaign } from "@/lib/domain/public";
import type { CampaignConfig } from "@/lib/domain/config";

/** Visualização completa do rascunho: quiz → resultado (motor de regras local) → página de vendas. */
export function PreviewApp({ id, slug, name, config }: { id: string; slug: string; name: string; config: CampaignConfig }) {
  const [run, setRun] = useState(0);
  const [info, setInfo] = useState<{ profileId: string | null; ruleId: string | null } | null>(null);
  const [view, setView] = useState<"quiz" | "offer">("quiz");
  const campaign = useMemo(() => toPublicCampaign({ id, slug, config }), [id, slug, config]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const driver = useMemo(() => createPreviewDriver(config, setInfo), [config, run]);
  const profile = config.profiles.find((p) => p.id === info?.profileId) ?? null;
  const rule = config.rules.find((r) => r.id === info?.ruleId) ?? null;

  return (
    <div
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        if (a?.getAttribute("href") === "#preview-oferta") {
          e.preventDefault();
          setView("offer");
          window.scrollTo(0, 0);
        } else if (a?.getAttribute("href") === "#checkout") {
          e.preventDefault();
          alert(`No ar, este botão registra o clique e redireciona para:\n${config.offer.checkoutUrl || "(checkout não configurado)"}`);
        }
      }}
    >
      <div className="fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-between gap-3 bg-zinc-900 px-4 text-xs text-zinc-200">
        <span className="flex items-center gap-2 truncate">
          <Eye className="size-3.5" /> Pré-visualização do rascunho — <b className="truncate">{name}</b> · nada é registrado
        </span>
        <span className="flex items-center gap-3">
          {info && (
            <span className="hidden sm:inline">
              Perfil: <b>{profile?.name ?? "—"}</b> · {rule ? `regra “${rule.name}”` : "nenhuma regra atendida (padrão)"}
            </span>
          )}
          <button
            className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-800 cursor-pointer"
            onClick={() => {
              setRun((r) => r + 1);
              setInfo(null);
              setView("quiz");
            }}
          >
            <RotateCcw className="size-3.5" /> Reiniciar
          </button>
        </span>
      </div>
      <div className="pt-10">
        {view === "quiz" ? (
          <QuizRunner key={run} campaign={campaign} driver={driver} />
        ) : (
          <SalesPageView page={config.salesPage} offer={config.offer} ctx={{ profile: profile && { id: profile.id, name: profile.name }, checkoutHref: () => "#checkout" }} />
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Eye, RotateCcw } from "lucide-react";
import { QuizRunner } from "@/components/public/quiz-runner";
import { SalesPageView, type Legal, type PersonalData } from "@/components/public/sales-page";
import { createPreviewDriver } from "@/components/admin/preview-driver";
import { toPublicCampaign } from "@/lib/domain/public";
import type { CampaignConfig } from "@/lib/domain/config";
import type { Answers, Attributes } from "@/lib/engine/answers";

type Info = { profileId: string | null; ruleId: string | null; answers: Answers; attributes: Attributes; score: number };

/**
 * Visualização completa do rascunho: quiz → resultado (motor de regras local) → página de vendas
 * personalizada com as respostas dadas aqui. Também permite abrir a página de vendas por perfil.
 */
export function PreviewApp({ id, slug, name, config, legal }: { id: string; slug: string; name: string; config: CampaignConfig; legal: Legal }) {
  const [run, setRun] = useState(0);
  const [info, setInfo] = useState<Info | null>(null);
  const [view, setView] = useState<"quiz" | "offer">("quiz");
  const [forcedProfile, setForcedProfile] = useState<string | null>(null);
  const campaign = useMemo(() => toPublicCampaign({ id, slug, config }), [id, slug, config]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const driver = useMemo(() => createPreviewDriver(config, setInfo), [config, run]);

  const profileId = forcedProfile ?? info?.profileId ?? null;
  const profile = config.profiles.find((p) => p.id === profileId) ?? null;
  const rule = config.rules.find((r) => r.id === info?.ruleId) ?? null;
  // respostas reais do preview; ao forçar um perfil sem responder, o bloco personalizado mostra o aviso de pré-visualização
  const personal: PersonalData | undefined = info && !forcedProfile ? { quiz: config.quiz, answers: info.answers, attributes: info.attributes, score: info.score } : undefined;

  return (
    <div
      onClickCapture={(e) => {
        const a = (e.target as HTMLElement).closest("a");
        const href = a?.getAttribute("href");
        if (href === "#preview-oferta") {
          e.preventDefault();
          setView("offer");
          window.scrollTo(0, 0);
        } else if (href === "#checkout") {
          e.preventDefault();
          alert(`No ar, este botão registra o clique e redireciona para:\n${config.offer.checkoutUrl || "(checkout não configurado)"}`);
        }
      }}
    >
      <div className="fixed inset-x-0 top-0 z-50 flex h-11 items-center justify-between gap-3 bg-zinc-900 px-4 text-xs text-zinc-200">
        <span className="flex min-w-0 items-center gap-2 truncate">
          <Eye className="size-3.5 shrink-0" /> <span className="truncate">Rascunho — <b>{name}</b> · nada é registrado</span>
        </span>
        <span className="flex items-center gap-2">
          {info && !forcedProfile && (
            <span className="hidden md:inline">
              Perfil: <b>{profile?.name ?? "—"}</b> · {rule ? `regra “${rule.name}”` : "padrão"}
            </span>
          )}
          <select
            className="rounded bg-zinc-800 px-2 py-1 text-xs"
            value={forcedProfile ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "") {
                setForcedProfile(null);
                return;
              }
              setForcedProfile(v === "__none" ? null : v);
              setView("offer");
              window.scrollTo(0, 0);
              if (v === "__none") setInfo(null);
            }}
            aria-label="Ver página de vendas como perfil"
          >
            <option value="">Página de vendas por perfil…</option>
            <option value="__none">Sem perfil (visitante direto)</option>
            {config.profiles.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            className="flex items-center gap-1 rounded px-2 py-1 hover:bg-zinc-800 cursor-pointer"
            onClick={() => {
              setRun((r) => r + 1);
              setInfo(null);
              setForcedProfile(null);
              setView("quiz");
            }}
          >
            <RotateCcw className="size-3.5" /> Reiniciar
          </button>
        </span>
      </div>
      <div className="pt-11">
        {view === "quiz" ? (
          <QuizRunner key={run} campaign={campaign} driver={driver} />
        ) : (
          <SalesPageView
            page={config.salesPage}
            offer={config.offer}
            ctx={{ profile: profile && { id: profile.id, name: profile.name }, checkoutHref: () => "#checkout", personal: forcedProfile || info ? personal : null, legal }}
          />
        )}
      </div>
    </div>
  );
}

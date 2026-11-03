"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CircleCheck, Flag, Loader2, Sparkles } from "lucide-react";
import type { PublicCampaign, PublicProfile, PublicQuestion } from "@/lib/domain/public";
import { themeVars } from "./theme";
import { trackThirdParty } from "./pixel";

export type AnswerInput = string | string[] | number | null;
export type LeadInput = { name: string; email: string; consent: boolean };
export type Completion = { profile: PublicProfile | null; ctaHref: string; reasons?: string[]; reality?: string[] };

/** Abstração de I/O: o quiz publicado fala com a API; o preview do editor resolve localmente. */
export interface QuizDriver {
  start(): Promise<void>;
  answer(questionId: string, value: AnswerInput): Promise<void>;
  complete(): Promise<Completion>;
  resultViewed(): Promise<void>;
  lead(data: LeadInput): Promise<void>;
}

type Step =
  | { kind: "intro" }
  | { kind: "question"; index: number }
  | { kind: "lead"; after: "before_result" | "after_result" }
  | { kind: "analyzing" }
  | { kind: "result" }
  | { kind: "error"; message: string };

const space = (n: number) => `calc(${n}rem * var(--q-space))`;

export function QuizRunner({
  campaign,
  driver,
  initialStep,
  embedded = false,
  persistKey,
}: {
  campaign: PublicCampaign;
  driver: QuizDriver;
  initialStep?: Step;
  embedded?: boolean;
  /** quando definido, o progresso fica salvo na aba: recarregar a página retoma de onde parou */
  persistKey?: string;
}) {
  const { quiz, leadCapture } = campaign;
  const questions = quiz.questions;
  const [step, setStep] = useState<Step>(initialStep ?? (quiz.intro.enabled ? { kind: "intro" } : { kind: "question", index: 0 }));
  const [answers, setAnswers] = useState<Record<string, AnswerInput>>({});
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [leadDone, setLeadDone] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (initialStep) setStep(initialStep);
  }, [initialStep]);

  // retomar após recarregar a página (respostas + pergunta atual), sem duplicar o início do quiz
  useEffect(() => {
    if (!persistKey) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem(persistKey) || "null") as { answers: Record<string, AnswerInput>; index: number } | null;
      if (saved && saved.index >= 0 && saved.index < questions.length) {
        started.current = true;
        setAnswers(saved.answers || {});
        setStep({ kind: "question", index: saved.index });
      }
    } catch {
      // sem sessionStorage: começa do zero
    }
  }, [persistKey, questions.length]);
  useEffect(() => {
    if (!persistKey) return;
    try {
      if (step.kind === "question") sessionStorage.setItem(persistKey, JSON.stringify({ answers, index: step.index }));
      else if (step.kind === "result") sessionStorage.removeItem(persistKey);
    } catch {
      // ignora
    }
  }, [persistKey, step, answers]);

  const begin = useCallback(() => {
    if (!started.current) {
      started.current = true;
      void driver.start().catch(() => undefined);
      trackThirdParty("quiz_started");
    }
  }, [driver]);

  useEffect(() => {
    if (!quiz.intro.enabled && step.kind === "question") begin();
  }, [quiz.intro.enabled, step.kind, begin]);

  const finish = useCallback(async () => {
    setStep({ kind: "analyzing" });
    const steps = quiz.settings.transitionSteps.length;
    const minDelay = new Promise((r) => setTimeout(r, steps ? Math.min(2700, steps * 850) : 900));
    try {
      const [result] = await Promise.all([driver.complete(), minDelay]);
      setCompletion(result);
      setStep({ kind: "result" });
      trackThirdParty("quiz_completed", { profile: result.profile?.name });
      void driver.resultViewed().catch(() => undefined);
    } catch (e) {
      setStep({ kind: "error", message: e instanceof Error ? e.message : "Não foi possível calcular o resultado." });
    }
  }, [driver, quiz.settings.transitionSteps.length]);

  const next = useCallback(
    (index: number) => {
      if (index + 1 < questions.length) return setStep({ kind: "question", index: index + 1 });
      if (leadCapture.mode === "before_result" && !leadDone) return setStep({ kind: "lead", after: "before_result" });
      void finish();
    },
    [questions.length, leadCapture.mode, leadDone, finish],
  );

  const submitAnswer = (q: PublicQuestion, index: number, value: AnswerInput) => {
    setAnswers((a) => ({ ...a, [q.id]: value }));
    // envio em segundo plano; o driver garante a ordem antes da conclusão
    void driver.answer(q.id, value).catch(() => undefined);
    next(index);
  };

  const progress = step.kind === "question" ? (step.index + 1) / Math.max(questions.length, 1) : step.kind === "intro" ? 0 : 1;

  return (
    <div style={themeVars(campaign.theme)} className={embedded ? "h-full overflow-y-auto" : "min-h-dvh"}>
      <div className="mx-auto flex w-full max-w-xl flex-col" style={{ minHeight: embedded ? "100%" : "100dvh", padding: `${space(1.25)} ${space(1.25)} ${space(2)}` }}>
        {quiz.settings.showProgress && step.kind !== "intro" && step.kind !== "result" && (
          <div className="mb-6 flex items-center gap-3">
            {quiz.settings.allowBack && step.kind === "question" && step.index > 0 ? (
              <button
                onClick={() => setStep({ kind: "question", index: step.index - 1 })}
                className="-ml-1 rounded-full p-1.5 opacity-70 transition hover:opacity-100 cursor-pointer"
                aria-label="Voltar"
              >
                <ArrowLeft className="size-5" />
              </button>
            ) : (
              <span className="size-8" />
            )}
            <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "color-mix(in srgb, var(--q-text) 10%, transparent)" }}>
              <div className="h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress * 100}%`, background: "var(--q-accent)" }} />
            </div>
            {step.kind === "question" && (
              <span className="w-10 text-right text-xs tabular-nums" style={{ color: "var(--q-muted)" }}>
                {step.index + 1}/{questions.length}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col" key={step.kind === "question" ? `q${step.index}` : step.kind}>
          {step.kind === "intro" && (
            <Intro
              campaign={campaign}
              onStart={() => {
                begin();
                setStep(questions.length ? { kind: "question", index: 0 } : { kind: "analyzing" });
              }}
            />
          )}
          {step.kind === "question" && questions[step.index]?.stage && (
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] animate-fade-in" style={{ color: "var(--q-accent)" }}>
              {questions[step.index].stage}
            </p>
          )}
          {step.kind === "question" && questions[step.index] && (
            <QuestionView
              question={questions[step.index]}
              initial={answers[questions[step.index].id]}
              autoAdvance={quiz.settings.autoAdvance}
              onSubmit={(v) => submitAnswer(questions[step.index], step.index, v)}
            />
          )}
          {step.kind === "lead" && (
            <LeadForm
              config={leadCapture}
              onSubmit={async (data) => {
                await driver.lead(data);
                trackThirdParty("lead_captured");
                setLeadDone(true);
                if (step.after === "before_result") void finish();
              }}
              onSkip={leadCapture.required ? undefined : () => (step.after === "before_result" ? void finish() : setLeadDone(true))}
            />
          )}
          {step.kind === "analyzing" &&
            (quiz.settings.transitionSteps.length ? (
              <AnalyzingSteps steps={quiz.settings.transitionSteps} />
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-fade-in">
                <Loader2 className="size-8 animate-spin" style={{ color: "var(--q-accent)" }} />
                <p className="text-lg font-medium">{quiz.settings.transitionMessage || "Analisando suas respostas..."}</p>
              </div>
            ))}
          {step.kind === "result" && completion && (
            <ResultView
              completion={completion}
              page={quiz.result}
              disclaimer={quiz.intro.disclaimer}
              leadSlot={
                leadCapture.mode === "after_result" && !leadDone ? (
                  <LeadForm
                    compact
                    config={leadCapture}
                    onSubmit={async (data) => {
                      await driver.lead(data);
                      trackThirdParty("lead_captured");
                      setLeadDone(true);
                    }}
                  />
                ) : leadCapture.mode === "after_result" && leadDone ? (
                  <p className="rounded-[var(--q-radius)] p-4 text-sm" style={{ background: "var(--q-surface)" }}>
                    Pronto! Seus dados foram registrados.
                  </p>
                ) : null
              }
            />
          )}
          {step.kind === "error" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              <p className="font-medium">{step.message}</p>
              <button className="text-sm underline cursor-pointer" onClick={() => location.reload()}>
                Tentar novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PrimaryButton({ children, className = "", ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={`w-full rounded-[var(--q-radius)] px-6 py-4 text-base font-semibold transition active:scale-[0.99] disabled:opacity-40 cursor-pointer ${className}`}
      style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}
      {...props}
    >
      {children}
    </button>
  );
}

function Intro({ campaign, onStart }: { campaign: PublicCampaign; onStart: () => void }) {
  const { intro } = campaign.quiz;
  const n = campaign.quiz.questions.length;
  const chips = ["Sua realidade", "Seus objetivos", "Seu tempo"];
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 animate-slide-up">
      {intro.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={intro.imageUrl} alt="" className="w-full rounded-[var(--q-radius)] object-cover max-h-64" />
      )}
      <div className="space-y-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ background: "color-mix(in srgb, var(--q-accent) 14%, transparent)", color: "var(--q-accent)" }}>
          <Sparkles className="size-3.5" /> Teste gratuito · resultado na hora
        </span>
        <h1 className="text-balance text-[1.95em] font-black leading-[1.08] tracking-tight">{intro.title || "Quiz"}</h1>
        {intro.subtitle && <p className="text-[1.04em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{intro.subtitle}</p>}
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {chips.map((c) => (
            <span key={c} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.82em] font-semibold" style={{ borderColor: "color-mix(in srgb, var(--q-text) 14%, transparent)" }}>
              <Check className="size-3.5" style={{ color: "var(--q-accent)" }} strokeWidth={3} /> {c}
            </span>
          ))}
        </div>
      </div>
      <PrimaryButton onClick={onStart}>
        <span className="inline-flex items-center justify-center gap-2 uppercase tracking-wide">{intro.ctaLabel || "Começar"} <ArrowRight className="size-4" /></span>
      </PrimaryButton>
      <p className="text-center text-[0.85em]" style={{ color: "var(--q-muted)" }}>
        Responda {n} perguntas rápidas e descubra caminhos que fazem sentido para você.
      </p>
      {intro.disclaimer && <p className="text-center text-[11px] leading-relaxed" style={{ color: "var(--q-muted)" }}>{intro.disclaimer}</p>}
    </div>
  );
}

function QuestionView({
  question: q,
  initial,
  autoAdvance,
  onSubmit,
}: {
  question: PublicQuestion;
  initial: AnswerInput | undefined;
  autoAdvance: boolean;
  onSubmit: (v: AnswerInput) => void;
}) {
  const [selected, setSelected] = useState<string[]>(() =>
    Array.isArray(initial) ? initial : typeof initial === "string" && (q.type === "single" || q.type === "yes_no") ? [initial] : [],
  );
  const [text, setText] = useState(() => (typeof initial === "string" && q.type === "text" ? initial : typeof initial === "number" && q.type === "number" ? String(initial) : ""));
  const [range, setRange] = useState(() => (typeof initial === "number" ? initial : Math.round((q.min + q.max) / 2 / q.step) * q.step));
  const [feedback, setFeedback] = useState(false);
  const [locked, setLocked] = useState(false);

  const commit = (value: AnswerInput) => {
    if (locked) return;
    setLocked(true);
    if (q.feedback) {
      setFeedback(true);
      setTimeout(() => onSubmit(value), 1100);
    } else {
      setTimeout(() => onSubmit(value), q.type === "single" || q.type === "yes_no" ? 220 : 0);
    }
  };

  const choose = (id: string) => {
    if (q.type === "multiple") {
      setSelected((s) => {
        if (s.includes(id)) return s.filter((x) => x !== id);
        if (q.maxSelections > 0 && s.length >= q.maxSelections) return s;
        return [...s, id];
      });
      return;
    }
    setSelected([id]);
    if (autoAdvance) commit(id);
  };

  const numberValue = text.trim() === "" ? null : Number(text.replace(",", "."));
  const canContinue =
    q.type === "multiple"
      ? selected.length > 0
      : q.type === "text"
        ? text.trim().length > 0
        : q.type === "number"
          ? numberValue != null && Number.isFinite(numberValue)
          : q.type === "range"
            ? true
            : selected.length > 0;

  const continueValue = (): AnswerInput =>
    q.type === "multiple" ? selected : q.type === "text" ? text.trim() : q.type === "number" ? numberValue : q.type === "range" ? range : selected[0];

  const showContinue = q.type === "multiple" || q.type === "text" || q.type === "number" || q.type === "range" || !autoAdvance;

  return (
    <div className="flex flex-1 flex-col animate-slide-up">
      <div className="mb-6 space-y-2">
        {q.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={q.imageUrl} alt="" className="mb-4 w-full rounded-[var(--q-radius)] object-cover max-h-56" />
        )}
        <h2 className="text-[1.4em] font-bold leading-snug tracking-tight">{q.title}</h2>
        {q.description && <p className="leading-relaxed" style={{ color: "var(--q-muted)" }}>{q.description}</p>}
        {q.type === "multiple" && (
          <p className="text-sm" style={{ color: "var(--q-muted)" }}>
            {q.maxSelections > 0 ? `Escolha até ${q.maxSelections}` : "Escolha quantas quiser"}
          </p>
        )}
      </div>

      {(q.type === "single" || q.type === "multiple" || q.type === "yes_no") && (
        <div className={q.type === "yes_no" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"} role={q.type === "multiple" ? "group" : "radiogroup"}>
          {q.options.map((o) => {
            const active = selected.includes(o.id);
            return (
              <button
                key={o.id}
                role={q.type === "multiple" ? "checkbox" : "radio"}
                aria-checked={active}
                onClick={() => choose(o.id)}
                className="flex min-h-14 items-center gap-3 rounded-[var(--q-radius)] border-2 px-4 py-3.5 text-left text-[1.02em] font-medium transition-all duration-150 active:scale-[0.99] cursor-pointer"
                style={{
                  borderColor: active ? "var(--q-accent)" : "transparent",
                  background: active ? "color-mix(in srgb, var(--q-accent) 10%, var(--q-surface))" : "var(--q-surface)",
                  justifyContent: q.type === "yes_no" ? "center" : undefined,
                }}
              >
                {q.type === "multiple" && (
                  <span
                    className="grid size-5 shrink-0 place-items-center rounded-md border-2 transition"
                    style={{ borderColor: active ? "var(--q-accent)" : "color-mix(in srgb, var(--q-text) 25%, transparent)", background: active ? "var(--q-accent)" : "transparent" }}
                  >
                    {active && <Check className="size-3.5" style={{ color: "var(--q-accent-text)" }} />}
                  </span>
                )}
                <span className="flex-1">{o.label}</span>
                {q.type !== "multiple" && active && <Check className="size-5 shrink-0 animate-fade-in" style={{ color: "var(--q-accent)" }} />}
              </button>
            );
          })}
        </div>
      )}

      {(q.type === "text" || q.type === "number") && (
        <input
          autoFocus
          type={q.type === "number" ? "text" : "text"}
          inputMode={q.type === "number" ? "decimal" : "text"}
          value={text}
          maxLength={q.type === "text" ? 500 : 20}
          placeholder={q.placeholder}
          onChange={(e) => setText(q.type === "number" ? e.target.value.replace(/[^\d.,-]/g, "") : e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && canContinue && commit(continueValue())}
          className="w-full rounded-[var(--q-radius)] border-2 px-4 py-4 text-[1.05em] outline-none transition focus:border-[var(--q-accent)]"
          style={{ background: "var(--q-surface)", borderColor: "transparent", color: "var(--q-text)" }}
        />
      )}

      {q.type === "range" && (
        <div className="space-y-5 rounded-[var(--q-radius)] p-5" style={{ background: "var(--q-surface)" }}>
          <p className="text-center text-[2em] font-bold tabular-nums" style={{ color: "var(--q-accent)" }}>
            {q.prefix}
            {range.toLocaleString("pt-BR")}
            {q.suffix}
          </p>
          <input
            type="range"
            min={q.min}
            max={q.max}
            step={q.step}
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="w-full cursor-pointer"
            style={{ accentColor: "var(--q-accent)" }}
            aria-label={q.title}
          />
          <div className="flex justify-between text-xs" style={{ color: "var(--q-muted)" }}>
            <span>{q.prefix}{q.min.toLocaleString("pt-BR")}{q.suffix}</span>
            <span>{q.prefix}{q.max.toLocaleString("pt-BR")}{q.suffix}</span>
          </div>
        </div>
      )}

      {feedback && q.feedback && (
        <p className="mt-4 rounded-[var(--q-radius)] px-4 py-3 text-sm font-medium animate-slide-up" style={{ background: "color-mix(in srgb, var(--q-accent) 12%, transparent)" }}>
          {q.feedback}
        </p>
      )}

      <div className="mt-auto space-y-2 pt-8">
        {showContinue && (
          <PrimaryButton disabled={!canContinue || locked} onClick={() => commit(continueValue())}>
            Continuar
          </PrimaryButton>
        )}
        {!q.required && (
          <button onClick={() => commit(null)} disabled={locked} className="w-full py-2 text-sm underline-offset-4 hover:underline cursor-pointer" style={{ color: "var(--q-muted)" }}>
            Pular pergunta
          </button>
        )}
      </div>
    </div>
  );
}

function LeadForm({
  config,
  onSubmit,
  onSkip,
  compact,
}: {
  config: PublicCampaign["leadCapture"];
  onSubmit: (d: LeadInput) => Promise<void>;
  onSkip?: () => void;
  compact?: boolean;
}) {
  const [f, setF] = useState({ name: "", email: "", consent: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email) && f.consent;
  const input = "w-full rounded-[var(--q-radius)] border-2 px-4 py-3.5 outline-none transition focus:border-[var(--q-accent)]";
  const inputStyle = { background: compact ? "var(--q-bg)" : "var(--q-surface)", borderColor: "transparent", color: "var(--q-text)" };

  return (
    <form
      className={compact ? "space-y-3 rounded-[var(--q-radius)] p-5" : "flex flex-1 flex-col justify-center gap-4 animate-slide-up"}
      style={compact ? { background: "var(--q-surface)" } : undefined}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        setError(null);
        try {
          await onSubmit(f);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Não foi possível enviar.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <h2 className={compact ? "font-semibold" : "text-[1.4em] font-bold leading-snug"}>{config.title}</h2>
        {config.description && <p className="text-sm" style={{ color: "var(--q-muted)" }}>{config.description}</p>}
      </div>
      {config.askName && (
        <input className={input} style={inputStyle} placeholder="Seu primeiro nome" autoComplete="given-name" maxLength={120} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      )}
      <input className={input} style={inputStyle} type="email" placeholder="Seu melhor e-mail" autoComplete="email" required maxLength={200} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
      <label className="flex items-start gap-2.5 text-xs leading-relaxed cursor-pointer" style={{ color: "var(--q-muted)" }}>
        <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-0.5 size-4 shrink-0" style={{ accentColor: "var(--q-accent)" }} />
        <span>
          {config.consentText}{" "}
          <a href="/privacidade" target="_blank" className="underline">Ver Política de Privacidade</a>
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <PrimaryButton type="submit" disabled={!valid || busy}>{busy ? "Enviando..." : "Enviar"}</PrimaryButton>
      {onSkip && (
        <button type="button" onClick={onSkip} className="w-full py-1 text-sm hover:underline cursor-pointer" style={{ color: "var(--q-muted)" }}>
          Continuar sem informar
        </button>
      )}
    </form>
  );
}

function Paragraphs({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/\n{2,}|\n/).map((p) => p.trim()).filter(Boolean), [text]);
  return (
    <>
      {parts.map((p, i) => (
        <p key={i} className="leading-relaxed">{p}</p>
      ))}
    </>
  );
}

/** Transição de análise: cada etapa aparece em sequência e é marcada como concluída (sem simular IA). */
function AnalyzingSteps({ steps }: { steps: string[] }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setDone((d) => Math.min(d + 1, steps.length)), 800);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div className="flex flex-1 flex-col justify-center gap-4 animate-fade-in">
      {steps.map((m, i) => (
        <div key={i} className="flex items-center gap-3 transition-opacity duration-300" style={{ opacity: i <= done ? 1 : 0.25 }}>
          {i < done ? (
            <span className="grid size-6 shrink-0 place-items-center rounded-full" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}><Check className="size-3.5" strokeWidth={3} /></span>
          ) : (
            <Loader2 className={`size-6 shrink-0 ${i === done ? "animate-spin" : ""}`} style={{ color: "var(--q-accent)" }} />
          )}
          <p className="text-[1.02em] font-semibold">{m}</p>
        </div>
      ))}
    </div>
  );
}

function ResultView({
  completion,
  page,
  leadSlot,
  disclaimer,
}: {
  completion: Completion;
  page?: PublicCampaign["quiz"]["result"];
  leadSlot: React.ReactNode;
  disclaimer: string;
}) {
  const p = completion.profile;
  if (!p) return <p className="m-auto">Obrigado por responder!</p>;
  const accent = { color: "var(--q-accent)" };
  const surface = { background: "var(--q-surface)" };
  const hair = "color-mix(in srgb, var(--q-text) 10%, transparent)";
  const reasons = completion.reasons?.length ? completion.reasons : p.highlights;
  const reality = completion.reality ?? [];
  const paths = p.paths ?? [];
  return (
    <div className="space-y-7 pb-4 animate-slide-up">
      {/* 1 · análise concluída */}
      <div className="space-y-3 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ background: "color-mix(in srgb, var(--q-accent) 14%, transparent)", ...accent }}>
          <CircleCheck className="size-3.5" /> {page?.eyebrow || "Análise concluída"}
        </span>
        {page?.headline && <p className="text-[1.05em] font-semibold leading-snug" style={{ color: "var(--q-muted)" }}>{page.headline}</p>}
      </div>

      {/* 2 · perfil identificado */}
      <div className="rounded-[calc(var(--q-radius)+4px)] border p-5 text-center" style={{ borderColor: "color-mix(in srgb, var(--q-accent) 45%, transparent)", background: "radial-gradient(120% 90% at 50% 0%, color-mix(in srgb, var(--q-accent) 14%, transparent), transparent 70%), var(--q-surface)" }}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--q-muted)" }}>Seu perfil</p>
        <h1 className="mt-1 text-[1.6em] font-black leading-tight tracking-tight" style={accent}>{p.name}</h1>
        {p.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className="mt-3 w-full rounded-[var(--q-radius)] object-cover max-h-60" />
        )}
        {p.title && <p className="mt-3 text-[1.08em] font-bold leading-snug">{p.title}</p>}
      </div>

      {/* 2 · sua realidade (resumo das respostas) */}
      {reality.length > 0 && (
        <div className="rounded-[var(--q-radius)] p-5" style={surface}>
          <p className="mb-3 text-[0.95em] font-bold">{page?.realityTitle || "Sua realidade"}</p>
          <ul className="space-y-2.5">
            {reality.map((r, i) => (
              <li key={i} className="flex gap-2.5 text-[0.95em] leading-snug">
                <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: "var(--q-accent)" }} />
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3 · por que esse caminho (relação entre respostas e recomendação) */}
      {(p.subtitle || p.description || reasons.length > 0) && (
        <div className="space-y-3">
          <p className="text-[0.95em] font-bold">{page?.reasonsTitle || "Por que esse caminho?"}</p>
          {(p.subtitle || p.description) && <p className="text-[0.95em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{p.subtitle || p.description}</p>}
          {reasons.length > 0 && (
            <ul className="space-y-2.5">
              {reasons.map((r, i) => (
                <li key={i} className="flex gap-2.5 text-[0.95em] leading-snug">
                  <Check className="mt-0.5 size-4 shrink-0" style={accent} strokeWidth={3} />
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 4 · caminhos recomendados */}
      {paths.length > 0 && (
        <div>
          <p className="mb-3 text-[0.95em] font-bold">{page?.pathsTitle || "Caminhos recomendados"}</p>
          <div className="space-y-3">
            {paths.map((path, i) => (
              <div key={i} className="rounded-[var(--q-radius)] border p-4" style={{ borderColor: hair, ...surface }}>
                <div className="flex items-start gap-3">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full text-[13px] font-black" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}>{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-bold leading-snug">{path.title}</p>
                    {path.how && <p className="mt-1 text-[0.9em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{path.how}</p>}
                  </div>
                </div>
                <dl className="mt-3 grid gap-2 text-[0.86em]">
                  {path.needs && <div className="flex gap-2"><dt className="shrink-0 font-semibold">Para começar:</dt><dd style={{ color: "var(--q-muted)" }}>{path.needs}</dd></div>}
                  {path.challenge && <div className="flex gap-2"><dt className="shrink-0 font-semibold">Desafio:</dt><dd style={{ color: "var(--q-muted)" }}>{path.challenge}</dd></div>}
                  {path.firstStep && <div className="flex gap-2"><dt className="shrink-0 font-semibold" style={accent}>1º passo:</dt><dd>{path.firstStep}</dd></div>}
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* compatibilidade com perfis antigos (sem caminhos) */}
      {paths.length === 0 && p.recommendations.length > 0 && (
        <div>
          <p className="mb-3 text-sm font-semibold">Recomendações</p>
          <ol className="space-y-2.5">
            {p.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 text-[0.95em]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}>{i + 1}</span>
                <span className="pt-0.5">{r}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      {p.content && <div className="space-y-3"><Paragraphs text={p.content} /></div>}

      {/* 5 · primeiro passo prático */}
      {p.firstStep && (
        <div className="flex gap-3 rounded-[var(--q-radius)] border-l-4 p-4" style={{ borderColor: "var(--q-accent)", ...surface }}>
          <Flag className="mt-0.5 size-5 shrink-0" style={accent} />
          <div>
            <p className="text-[0.95em] font-bold">{page?.firstStepTitle || "Seu primeiro passo"}</p>
            <p className="mt-1 text-[0.92em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{p.firstStep}</p>
          </div>
        </div>
      )}

      {leadSlot}

      {/* 6 · transição comercial */}
      <div className="space-y-4 pt-2 text-center">
        {page?.transitionTitle && (
          <div className="space-y-2">
            <Sparkles className="mx-auto size-5" style={accent} />
            <p className="text-[1.3em] font-black leading-tight tracking-tight">{page.transitionTitle}</p>
            {page.transitionText && <p className="text-[0.95em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{page.transitionText}</p>}
          </div>
        )}
        <a
          href={completion.ctaHref}
          className="flex w-full items-center justify-center gap-2 rounded-[var(--q-radius)] px-6 py-4 text-center text-[0.95em] font-extrabold uppercase tracking-wide transition active:scale-[0.99]"
          style={{ background: "var(--q-accent)", color: "var(--q-accent-text)", boxShadow: "0 12px 30px -12px color-mix(in srgb, var(--q-accent) 75%, transparent)" }}
        >
          {p.ctaLabel || "Continuar"} <ArrowRight className="size-4" />
        </a>
      </div>
      {disclaimer && <p className="text-center text-[11px]" style={{ color: "var(--q-muted)" }}>{disclaimer}</p>}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import type { PublicCampaign, PublicProfile, PublicQuestion } from "@/lib/domain/public";
import { themeVars } from "./theme";
import { trackThirdParty } from "./pixel";

export type AnswerInput = string | string[] | number | null;
export type LeadInput = { name: string; email: string; consent: boolean };
export type Completion = { profile: PublicProfile | null; ctaHref: string };

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
}: {
  campaign: PublicCampaign;
  driver: QuizDriver;
  initialStep?: Step;
  embedded?: boolean;
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
    const minDelay = new Promise((r) => setTimeout(r, 900));
    try {
      const [result] = await Promise.all([driver.complete(), minDelay]);
      setCompletion(result);
      setStep({ kind: "result" });
      trackThirdParty("quiz_completed", { profile: result.profile?.name });
      void driver.resultViewed().catch(() => undefined);
    } catch (e) {
      setStep({ kind: "error", message: e instanceof Error ? e.message : "Não foi possível calcular o resultado." });
    }
  }, [driver]);

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
          {step.kind === "analyzing" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center animate-fade-in">
              <Loader2 className="size-8 animate-spin" style={{ color: "var(--q-accent)" }} />
              <p className="text-lg font-medium">{quiz.settings.transitionMessage || "Analisando suas respostas..."}</p>
            </div>
          )}
          {step.kind === "result" && completion && (
            <ResultView
              completion={completion}
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
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 animate-slide-up">
      {intro.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={intro.imageUrl} alt="" className="w-full rounded-[var(--q-radius)] object-cover max-h-64" />
      )}
      <div className="space-y-3 text-center">
        <h1 className="text-[1.75em] font-bold leading-tight tracking-tight">{intro.title || "Quiz"}</h1>
        {intro.subtitle && <p className="text-[1.05em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{intro.subtitle}</p>}
      </div>
      <PrimaryButton onClick={onStart}>{intro.ctaLabel || "Começar"}</PrimaryButton>
      <p className="text-center text-xs" style={{ color: "var(--q-muted)" }}>
        {campaign.quiz.questions.length} perguntas · menos de 2 minutos
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
          <a href="/privacidade" target="_blank" className="underline">Política de Privacidade</a>
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

function ResultView({ completion, leadSlot, disclaimer }: { completion: Completion; leadSlot: React.ReactNode; disclaimer: string }) {
  const p = completion.profile;
  if (!p) return <p className="m-auto">Obrigado por responder!</p>;
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="space-y-3 text-center">
        <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--q-accent) 12%, transparent)", color: "var(--q-accent)" }}>
          Seu perfil: {p.name}
        </span>
        {p.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imageUrl} alt="" className="w-full rounded-[var(--q-radius)] object-cover max-h-60" />
        )}
        <h1 className="text-[1.6em] font-bold leading-tight tracking-tight">{p.title || p.name}</h1>
        {p.subtitle && <p className="text-[1.05em]" style={{ color: "var(--q-muted)" }}>{p.subtitle}</p>}
      </div>
      {p.description && <div className="space-y-3"><Paragraphs text={p.description} /></div>}
      {p.highlights.length > 0 && (
        <div className="rounded-[var(--q-radius)] p-5" style={{ background: "var(--q-surface)" }}>
          <p className="mb-3 text-sm font-semibold">O que suas respostas indicam</p>
          <ul className="space-y-2">
            {p.highlights.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-[0.95em]"><Check className="mt-0.5 size-4 shrink-0" style={{ color: "var(--q-accent)" }} />{h}</li>
            ))}
          </ul>
        </div>
      )}
      {p.recommendations.length > 0 && (
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
      {leadSlot}
      <a
        href={completion.ctaHref}
        className="block w-full rounded-[var(--q-radius)] px-6 py-4 text-center text-base font-semibold transition active:scale-[0.99]"
        style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}
      >
        {p.ctaLabel || "Continuar"}
      </a>
      {disclaimer && <p className="text-center text-[11px]" style={{ color: "var(--q-muted)" }}>{disclaimer}</p>}
    </div>
  );
}

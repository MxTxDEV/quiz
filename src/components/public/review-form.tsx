"use client";

import { useRef, useState } from "react";
import { Star } from "lucide-react";

const labels = ["", "Ruim", "Regular", "Bom", "Muito bom", "Excelente"];

export function ReviewForm({ slug, consentText }: { slug: string; consentText: string }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ name: "", city: "", text: "", email: "", consent: false });
  const openedAt = useRef(Date.now());
  const [state, setState] = useState<{ status: "idle" | "sending" | "done" | "error"; message?: string; verified?: boolean }>({ status: "idle" });
  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setState({ status: "error", message: "Escolha de 1 a 5 estrelas." });
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/public/review", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug, rating, ...form, elapsedMs: Date.now() - openedAt.current }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setState({ status: "error", message: data.error || "Não foi possível enviar. Tente de novo." });
      setState({ status: "done", verified: !!data.verified });
    } catch {
      setState({ status: "error", message: "Sem conexão. Tente de novo." });
    }
  }

  const field = "w-full rounded-[var(--q-radius)] border px-4 py-3.5 text-[1em] outline-none transition focus:border-[var(--q-accent)]";
  const fieldStyle = { background: "var(--q-surface)", borderColor: "color-mix(in srgb, var(--q-text) 14%, transparent)", color: "var(--q-text)" };

  if (state.status === "done")
    return (
      <div className="mt-8 rounded-[var(--q-radius)] border p-6 text-center" style={{ borderColor: "color-mix(in srgb, var(--q-accent) 45%, transparent)", background: "var(--q-surface)" }}>
        <p className="text-[1.3em] font-extrabold">Obrigado pela avaliação!</p>
        <p className="mt-2 text-[0.95em]" style={{ color: "var(--q-muted)" }}>
          Ela passa por uma revisão rápida antes de aparecer na página{state.verified ? " e vai com o selo de compra verificada." : "."}
        </p>
      </div>
    );

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <div className="text-center">
        <div className="inline-flex gap-1.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Nota de 1 a 5 estrelas">
          {[1, 2, 3, 4, 5].map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={rating === i}
              aria-label={`${i} ${i === 1 ? "estrela" : "estrelas"}`}
              onMouseEnter={() => setHover(i)}
              onClick={() => setRating(i)}
              className="cursor-pointer p-1 transition active:scale-90"
            >
              <Star className="size-10" strokeWidth={1.5} style={{ fill: i <= (hover || rating) ? "#ffb020" : "transparent", color: i <= (hover || rating) ? "#ffb020" : "var(--q-muted)" }} />
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-[0.85em] font-semibold" style={{ color: "var(--q-muted)" }}>{labels[hover || rating]}</p>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[0.85em] font-semibold">O que você achou?</span>
        <textarea required minLength={20} maxLength={800} rows={5} value={form.text} onChange={(e) => set("text", e.target.value)} className={field} style={fieldStyle} placeholder="Conte o que mais ajudou, o que você está aplicando ou o que poderia melhorar." />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[0.85em] font-semibold">Seu nome</span>
          <input required maxLength={60} value={form.name} onChange={(e) => set("name", e.target.value)} className={field} style={fieldStyle} autoComplete="name" />
          <span className="mt-1 block text-[0.75em]" style={{ color: "var(--q-muted)" }}>Exibimos só o primeiro nome e a inicial.</span>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[0.85em] font-semibold">Cidade (opcional)</span>
          <input maxLength={60} value={form.city} onChange={(e) => set("city", e.target.value)} className={field} style={fieldStyle} autoComplete="address-level2" />
        </label>
      </div>
      <label className="block">
        <span className="mb-1.5 block text-[0.85em] font-semibold">E-mail usado na compra</span>
        <input required type="email" maxLength={200} value={form.email} onChange={(e) => set("email", e.target.value)} className={field} style={fieldStyle} autoComplete="email" inputMode="email" />
        <span className="mt-1 block text-[0.75em]" style={{ color: "var(--q-muted)" }}>Só para confirmar a compra. Nunca é exibido.</span>
      </label>
      <label className="flex items-start gap-3 text-[0.85em] leading-relaxed">
        <input type="checkbox" required checked={form.consent} onChange={(e) => set("consent", e.target.checked)} className="mt-1 size-4 shrink-0 accent-[var(--q-accent)]" />
        <span style={{ color: "var(--q-muted)" }}>{consentText}</span>
      </label>
      {state.status === "error" && <p className="text-center text-[0.9em] font-semibold text-red-400">{state.message}</p>}
      <button
        type="submit"
        disabled={state.status === "sending"}
        className="w-full cursor-pointer rounded-[var(--q-radius)] px-6 py-4 text-[1em] font-extrabold uppercase tracking-wide transition active:scale-[0.99] disabled:opacity-50"
        style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}
      >
        {state.status === "sending" ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}

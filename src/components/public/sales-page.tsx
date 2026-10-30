import { Check, Gift, ShieldCheck } from "lucide-react";
import type { Block, Offer, SalesPage } from "@/lib/domain/config";
import { themeVars } from "./theme";

/**
 * Renderizador da página de vendas. Componente sem estado (funciona em Server e Client Components),
 * usado tanto na página pública quanto no preview do editor.
 */

export type SalesContext = {
  profile: { id: string; name: string } | null;
  /** href do botão de compra; recebe o id do bloco para atribuição */
  checkoutHref: (blockId: string) => string;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

function fill(text: string, ctx: SalesContext) {
  return text.replace(/\{\{\s*perfil\s*\}\}/gi, ctx.profile?.name ?? "");
}

export function visibleBlocks(blocks: Block[], profileId: string | null) {
  return blocks.filter((b) => b.profileIds.length === 0 || (profileId != null && b.profileIds.includes(profileId)));
}

function embedUrl(url: string): { kind: "iframe" | "video"; src: string } | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.split("/").pop();
      return id ? { kind: "iframe", src: `https://www.youtube-nocookie.com/embed/${id}` } : null;
    }
    if (host === "youtu.be") return { kind: "iframe", src: `https://www.youtube-nocookie.com/embed${u.pathname}` };
    if (host === "vimeo.com") return { kind: "iframe", src: `https://player.vimeo.com/video${u.pathname}` };
    if (host === "player.vimeo.com" || host.endsWith("youtube-nocookie.com")) return { kind: "iframe", src: url };
    return { kind: "video", src: url };
  } catch {
    return null;
  }
}

const section = "px-5 sm:px-8";
const sectionStyle = { paddingTop: "calc(1.75rem * var(--q-space))", paddingBottom: "calc(1.75rem * var(--q-space))" };
const card = { background: "var(--q-surface)", borderRadius: "var(--q-radius)" };

function CtaButton({ href, label, note }: { href: string; label: string; note?: string }) {
  return (
    <div className="space-y-2 text-center">
      <a
        href={href}
        className="block w-full rounded-[var(--q-radius)] px-6 py-4 text-[1.05em] font-bold transition hover:opacity-95 active:scale-[0.99]"
        style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}
      >
        {label}
      </a>
      {note && <p className="text-xs" style={{ color: "var(--q-muted)" }}>{note}</p>}
    </div>
  );
}

function PriceBox({ offer, title }: { offer: Offer; title: string }) {
  const hasRef = offer.referencePriceCents != null && offer.referencePriceCents > offer.priceCents && offer.referencePriceNote;
  return (
    <div className="p-6 text-center space-y-2" style={card}>
      {title && <p className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--q-muted)" }}>{title}</p>}
      {hasRef && (
        <p className="text-sm" style={{ color: "var(--q-muted)" }}>
          De <s>{money(offer.referencePriceCents!, offer.currency)}</s> por
        </p>
      )}
      <p className="text-[2.4em] font-extrabold leading-none tracking-tight">{money(offer.priceCents, offer.currency)}</p>
      {offer.paymentTerms && <p className="text-sm" style={{ color: "var(--q-muted)" }}>{offer.paymentTerms}</p>}
      {hasRef && <p className="text-[11px]" style={{ color: "var(--q-muted)" }}>Preço de referência: {offer.referencePriceNote}</p>}
    </div>
  );
}

function BlockView({ block: b, offer, ctx }: { block: Block; offer: Offer; ctx: SalesContext }) {
  switch (b.type) {
    case "headline":
      return <h1 className={`text-[2em] sm:text-[2.4em] font-extrabold leading-[1.1] tracking-tight ${b.align === "center" ? "text-center" : ""}`}>{fill(b.text, ctx)}</h1>;
    case "subheadline":
      return <p className={`text-[1.15em] leading-relaxed ${b.align === "center" ? "text-center" : ""}`} style={{ color: "var(--q-muted)" }}>{fill(b.text, ctx)}</p>;
    case "image":
    case "mockup":
      if (!b.url) return null;
      return (
        <figure className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={b.url} alt={b.type === "image" ? b.alt : b.caption} loading="lazy" className={`w-full object-contain ${b.type === "mockup" ? "max-h-96" : ""}`} style={{ borderRadius: "var(--q-radius)" }} />
          {b.type === "mockup" && b.caption && <figcaption className="text-center text-sm" style={{ color: "var(--q-muted)" }}>{b.caption}</figcaption>}
        </figure>
      );
    case "video": {
      const e = embedUrl(b.url);
      if (!e) return null;
      return (
        <div className="aspect-video w-full overflow-hidden" style={{ borderRadius: "var(--q-radius)", background: "#000" }}>
          {e.kind === "iframe" ? (
            <iframe src={e.src} className="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" title="Vídeo" />
          ) : (
            <video src={e.src} controls preload="metadata" className="h-full w-full" />
          )}
        </div>
      );
    }
    case "benefits": {
      const items = b.useOffer ? offer.benefits : b.items;
      if (!items.length) return null;
      return (
        <div className="space-y-4">
          {b.title && <h2 className="text-[1.4em] font-bold tracking-tight">{fill(b.title, ctx)}</h2>}
          <ul className="space-y-3">
            {items.map((it, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full" style={{ background: "var(--q-accent)" }}>
                  <Check className="size-3" style={{ color: "var(--q-accent-text)" }} />
                </span>
                <span className="leading-relaxed">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    case "content":
      if (!b.items.length) return null;
      return (
        <div className="space-y-4">
          {b.title && <h2 className="text-[1.4em] font-bold tracking-tight">{b.title}</h2>}
          <div className="space-y-3">
            {b.items.map((it, i) => (
              <div key={i} className="p-4" style={card}>
                <p className="font-semibold">{it.title}</p>
                {it.description && <p className="mt-1 text-[0.95em] leading-relaxed" style={{ color: "var(--q-muted)" }}>{it.description}</p>}
              </div>
            ))}
          </div>
        </div>
      );
    case "bonuses":
      if (!offer.bonuses.length) return null;
      return (
        <div className="space-y-4">
          {b.title && <h2 className="text-[1.4em] font-bold tracking-tight">{b.title}</h2>}
          {offer.bonuses.map((bonus, i) => (
            <div key={i} className="flex gap-3 p-4" style={card}>
              <Gift className="mt-0.5 size-5 shrink-0" style={{ color: "var(--q-accent)" }} />
              <div>
                <p className="font-semibold">{bonus.title}</p>
                {bonus.description && <p className="mt-1 text-[0.95em]" style={{ color: "var(--q-muted)" }}>{bonus.description}</p>}
              </div>
            </div>
          ))}
        </div>
      );
    case "testimonials":
      if (!b.items.length) return null;
      return (
        <div className="space-y-4">
          {b.title && <h2 className="text-[1.4em] font-bold tracking-tight">{b.title}</h2>}
          <div className="grid gap-3 sm:grid-cols-2">
            {b.items.map((t, i) => (
              <figure key={i} className="p-4 space-y-3" style={card}>
                <blockquote className="text-[0.95em] leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="flex items-center gap-2.5 text-sm">
                  {t.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.avatarUrl} alt="" loading="lazy" className="size-8 rounded-full object-cover" />
                  )}
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    {t.role && <span className="block text-xs" style={{ color: "var(--q-muted)" }}>{t.role}</span>}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      );
    case "faq":
      if (!b.items.length) return null;
      return (
        <div className="space-y-4">
          {b.title && <h2 className="text-[1.4em] font-bold tracking-tight">{b.title}</h2>}
          <div className="space-y-2">
            {b.items.map((f, i) => (
              <details key={i} className="group p-4" style={card}>
                <summary className="cursor-pointer list-none font-semibold flex justify-between gap-3">
                  {f.question}
                  <span className="transition group-open:rotate-45 text-lg leading-none" style={{ color: "var(--q-muted)" }}>+</span>
                </summary>
                <p className="mt-2 text-[0.95em] leading-relaxed whitespace-pre-line" style={{ color: "var(--q-muted)" }}>{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      );
    case "price":
      return <PriceBox offer={offer} title={b.title} />;
    case "cta":
      return <CtaButton href={ctx.checkoutHref(b.id)} label={b.label || offer.buttonLabel || "Comprar"} note={b.note} />;
    case "guarantee": {
      const text = b.text || offer.guarantee;
      if (!text) return null;
      return (
        <div className="flex gap-4 p-5" style={card}>
          <ShieldCheck className="size-8 shrink-0" style={{ color: "var(--q-accent)" }} />
          <div>
            <p className="font-semibold">{b.title}</p>
            <p className="mt-1 text-[0.95em] leading-relaxed whitespace-pre-line" style={{ color: "var(--q-muted)" }}>{text}</p>
          </div>
        </div>
      );
    }
    case "footer":
      return (
        <footer className="border-t pt-6 text-center text-xs leading-relaxed space-y-2" style={{ color: "var(--q-muted)", borderColor: "color-mix(in srgb, var(--q-text) 10%, transparent)" }}>
          {b.text && <p className="whitespace-pre-line">{b.text}</p>}
          <p>
            <a href="/privacidade" className="underline">Política de Privacidade</a>
          </p>
        </footer>
      );
  }
}

export function SalesPageView({ page, offer, ctx, minHeight = "100dvh" }: { page: SalesPage; offer: Offer; ctx: SalesContext; minHeight?: string }) {
  const blocks = visibleBlocks(page.blocks, ctx.profile?.id ?? null);
  return (
    <div style={{ ...themeVars(page.theme), minHeight }}>
      <div className="mx-auto max-w-2xl">
        {blocks.map((b) => (
          <section key={b.id} className={section} style={sectionStyle} data-block={b.type}>
            <BlockView block={b} offer={offer} ctx={ctx} />
          </section>
        ))}
        {blocks.length === 0 && <p className="p-10 text-center" style={{ color: "var(--q-muted)" }}>Página sem blocos.</p>}
      </div>
    </div>
  );
}

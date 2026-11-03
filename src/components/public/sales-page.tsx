import type React from "react";
import { BadgeCheck, BookOpen, Briefcase, Check, ChevronDown, Download, Gift, Laptop, Lock, ShieldCheck, Smartphone, Star, Store, TrendingUp, Users, Wallet, X, Zap } from "lucide-react";
import type { Block, Brand, Offer, Quiz, SalesPage } from "@/lib/domain/config";
import type { Answers, Attributes } from "@/lib/engine/answers";
import { evaluateGroup } from "@/lib/engine/rules";
import { themeVars } from "./theme";
import { CoverImage } from "./cover-image";
import { LiquidOrb, LiquidWave, SalesBackdrop } from "./sales-decor";
import { SalesFx } from "./sales-fx";
import { usableImageUrl } from "@/lib/domain/images";
import type { SocialProof } from "@/lib/services/reviews";

/**
 * Renderizador da página de vendas. Componente sem estado (Server e Client Components):
 * usado na página pública, no preview do editor e na visualização do rascunho.
 * Todo o conteúdo vem da configuração da campanha — nada de produto fixo aqui.
 */

export type PersonalData = { quiz: Quiz; answers: Answers; attributes: Attributes; score: number };

export type Legal = { controllerName: string; document: string; contactEmail: string; hasTerms: boolean };

export type SalesContext = {
  profile: { id: string; name: string } | null;
  /** href do botão de compra; recebe o id do bloco para atribuição */
  checkoutHref: (blockId: string) => string;
  /** respostas reais do visitante; null = sem sessão; undefined = pré-visualização sem respostas */
  personal?: PersonalData | null;
  legal?: Legal;
  /** avaliações aprovadas e total real de compradores; undefined = pré-visualização do painel */
  social?: SocialProof;
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

function fill(text: string, ctx: SalesContext) {
  return text.replace(/\{\{\s*perfil\s*\}\}/gi, ctx.profile?.name ?? "");
}

/**
 * Blocos visíveis para o perfil. Em um grupo de variações, vence o bloco direcionado ao perfil;
 * sem correspondência, o bloco genérico (sem perfis) do grupo.
 */
export function visibleBlocks(blocks: Block[], profileId: string | null) {
  const matches = (b: Block) => b.profileIds.length > 0 && profileId != null && b.profileIds.includes(profileId);
  const groupsWithMatch = new Set(blocks.filter((b) => b.group && matches(b)).map((b) => b.group));
  const usedGroups = new Set<string>();
  return blocks.filter((b) => {
    if (!b.group) return b.profileIds.length === 0 || matches(b);
    if (usedGroups.has(b.group)) return false;
    const ok = groupsWithMatch.has(b.group) ? matches(b) : b.profileIds.length === 0;
    if (ok) usedGroups.add(b.group);
    return ok;
  });
}

/** Rótulo legível da resposta do visitante para uma pergunta (nunca inventa valores). */
export function answerLabel(quiz: Quiz, answers: Answers, questionId: string): string | null {
  const q = quiz.questions.find((x) => x.id === questionId);
  const a = answers[questionId];
  if (!q || a === undefined || a === null || a === "") return null;
  if (Array.isArray(a)) {
    const labels = a.map((id) => q.options.find((o) => o.id === id)?.label).filter(Boolean);
    return labels.length ? labels.join(", ") : null;
  }
  if (q.type === "single" || q.type === "yes_no") return q.options.find((o) => o.id === a)?.label ?? null;
  if (typeof a === "number") return `${q.prefix}${a.toLocaleString("pt-BR")}${q.suffix}`;
  return String(a);
}

/** Interpretações cujas condições foram atendidas pelas respostas reais. */
export function matchedInsights(block: Extract<Block, { type: "personalized" }>, p: PersonalData) {
  const ctx = { answers: p.answers, attributes: p.attributes, score: p.score };
  return block.insights.filter((i) => evaluateGroup(i.when, ctx)).slice(0, block.maxInsights);
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

// ---------------------------------------------------------------- elementos visuais

const muted = { color: "var(--q-muted)" };
const accent = { color: "var(--q-accent)" };
const hairline = "color-mix(in srgb, var(--q-text) 12%, transparent)";

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  if (!children) return null;
  return (
    <p className={`mb-4 flex items-center gap-2 text-[0.72em] font-bold uppercase tracking-[0.18em] ${center ? "justify-center" : ""}`} style={accent}>
      <span className="h-px w-6" style={{ background: "var(--q-accent)" }} />
      {children}
    </p>
  );
}

function H2({ children, center, className = "" }: { children: React.ReactNode; center?: boolean; className?: string }) {
  return (
    <h2 className={`text-balance text-[1.9em] font-extrabold leading-[1.08] tracking-[-0.025em] sm:text-[2.5em] ${center ? "text-center" : ""} ${className}`}>
      {children}
    </h2>
  );
}

function Paragraphs({ text, className = "" }: { text: string; className?: string }) {
  const parts = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={`space-y-4 ${className}`}>
      {parts.map((p, i) => (
        <p key={i} className="leading-relaxed whitespace-pre-line">{p}</p>
      ))}
    </div>
  );
}

function BuyButton({ href, label, note, purchase = true, wide = false }: { href: string; label: string; note?: React.ReactNode; purchase?: boolean; wide?: boolean }) {
  return (
    <div className={`space-y-3 ${wide ? "w-full" : ""}`}>
      <a
        href={href}
        data-purchase={purchase ? "" : undefined}
        className={`fx-liquid-btn group relative isolate overflow-hidden inline-flex min-h-14 items-center justify-center gap-2 rounded-[var(--q-radius)] px-5 py-4 text-center text-[0.86em] font-extrabold uppercase tracking-[0.02em] sm:px-7 sm:text-[0.95em] sm:tracking-wide transition duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 ${wide ? "w-full" : "w-full sm:w-auto"}`}
        style={{
          background: "var(--q-accent)",
          color: "var(--q-accent-text)",
          boxShadow: "0 10px 30px -10px color-mix(in srgb, var(--q-accent) 70%, transparent)",
        }}
      >
        <span aria-hidden className="fx-liquid" />
        <span className="relative">{label}</span>
        <span aria-hidden className="relative transition-transform group-hover:translate-x-0.5">→</span>
      </a>
      {note && <p className="flex items-center justify-center gap-1.5 text-[0.78em] sm:justify-start" style={muted}>{note}</p>}
    </div>
  );
}

/** Mockup 3D de livro. Usa a capa cadastrada ou gera uma capa com a identidade da página. */
export function BookMockup({
  title,
  label,
  imageUrl,
  checkoutUrl,
  size = "lg",
}: {
  title: string;
  label?: string;
  imageUrl?: string;
  /** links iguais ao checkout (ou de páginas) são ignorados: nunca viram imagem quebrada */
  checkoutUrl?: string;
  size?: "lg" | "md" | "sm";
}) {
  const src = usableImageUrl(imageUrl, checkoutUrl);
  const w = size === "lg" ? "w-[220px] sm:w-[260px]" : size === "md" ? "w-[104px] sm:w-[150px]" : "w-[110px]";
  const glow = size === "lg";
  return (
    <div className={`relative [perspective:1400px] ${glow ? "fx-hero-book" : ""}`} aria-hidden>
      {glow && (
        <>
          <div className="fx-aura" />
          <div className="fx-aura fx-aura-2" />
          <div className="fx-floor" />
          <span className="fx-twinkle fx-tw-1" />
          <span className="fx-twinkle fx-tw-2" />
          <span className="fx-twinkle fx-tw-3" />
        </>
      )}
      <div
        className={`relative ${w} aspect-[3/4] [transform-style:preserve-3d] transition-transform duration-500 [transform:rotateY(-22deg)_rotateX(4deg)] hover:[transform:rotateY(-12deg)_rotateX(2deg)]`}
      >
        {/* páginas */}
        <div
          className="absolute inset-y-[2%] right-0 w-[7%] origin-right [transform:rotateY(90deg)_translateX(50%)]"
          style={{ background: "repeating-linear-gradient(90deg,#e8e8e8 0 2px,#cfcfcf 2px 3px)" }}
        />
        {glow && <div className="fx-led" />}
        {/* capa */}
        <div
          className="absolute inset-0 overflow-hidden rounded-r-[6px] rounded-l-[2px]"
          style={{
            boxShadow: "inset 6px 0 10px -6px rgba(255,255,255,.35), 18px 28px 50px -12px rgba(0,0,0,.75)",
            background: "#0d0d0f",
            border: "1px solid rgba(255,255,255,.08)",
          }}
        >
          {/* a capa gerada fica sempre por baixo; a imagem cadastrada cobre por cima e some se não carregar */}
          <div className="relative flex h-full flex-col justify-between p-[9%] text-white">
              <svg className="absolute inset-0 h-full w-full opacity-90" viewBox="0 0 100 133" preserveAspectRatio="none">
                <path d="M-5 92 C 14 86, 24 70, 44 68 S 68 56, 72 40 S 90 18, 110 12" fill="none" stroke="var(--q-accent)" strokeWidth="1.2" strokeDasharray="3 3" />
                <circle cx="72" cy="40" r="2.6" fill="var(--q-accent)" />
                <circle cx="72" cy="40" r="6" fill="none" stroke="var(--q-accent)" strokeOpacity=".35" />
              </svg>
              <div className="relative h-[3px] w-[30%]" style={{ background: "var(--q-accent)" }} />
              <div className="relative">
                {label && <p className="mb-[6%] text-[0.5em] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--q-accent)" }}>{label}</p>}
                <p className={`font-black uppercase leading-[0.95] tracking-tight ${size === "lg" ? "text-[1.55em]" : size === "md" ? "text-[0.68em] sm:text-[0.95em]" : "text-[0.7em]"}`}>{title}</p>
              </div>
          </div>
          {src && <CoverImage src={src} className="absolute inset-0 h-full w-full object-cover" />}
          {glow && <div className="fx-cover-shine" />}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[6%]" style={{ background: "linear-gradient(90deg,rgba(0,0,0,.45),transparent)" }} />
        </div>
      </div>
    </div>
  );
}

function HeroVisual({ offer, brand, block }: { offer: Offer; brand: Brand; block: Extract<Block, { type: "hero" }> }) {
  const title = offer.productName || brand.name;
  const chips = [
    { icon: Wallet, className: "left-0 top-[12%]" },
    { icon: TrendingUp, className: "right-0 top-[4%]" },
    { icon: Store, className: "-left-2 bottom-[18%]" },
    { icon: Laptop, className: "right-2 bottom-[8%]" },
  ];
  return (
    <div className="relative mx-auto -mt-2 flex h-[330px] w-full max-w-[380px] items-center justify-center sm:mt-0 sm:h-[420px]">
      <div className="absolute inset-[12%] rounded-full blur-3xl" style={{ background: "color-mix(in srgb, var(--q-accent) 22%, transparent)" }} />
      <LiquidOrb />
      {chips.map(({ icon: Icon, className }, i) => (
        <div key={i} className={`fx-chip absolute ${className}`} style={{ "--spd": [0.35, 0.6, 0.5, 0.8][i], "--dur": `${6 + i * 1.5}s` } as React.CSSProperties} aria-hidden>
          <div
            className="fx-chip-inner grid size-11 place-items-center rounded-full border sm:backdrop-blur"
            style={{ borderColor: hairline, background: "color-mix(in srgb, var(--q-surface) 80%, transparent)" }}
          >
            <Icon className="size-[18px]" style={accent} />
          </div>
        </div>
      ))}
      <div className="fx-book relative">
        <BookMockup title={title || "Guia"} label={brand.tagline ? "Guia prático" : undefined} imageUrl={usableImageUrl(block.imageUrl, offer.checkoutUrl) || offer.coverImageUrl} checkoutUrl={offer.checkoutUrl} />
      </div>
    </div>
  );
}

function BrandMark({ brand }: { brand: Brand }) {
  if (usableImageUrl(brand.logoUrl))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={brand.logoUrl} alt={brand.name} className="h-7 w-auto" />;
  if (!brand.name) return null;
  const [first, ...rest] = brand.name.split(" ");
  return (
    <span className="text-[0.95em] font-black uppercase tracking-[0.08em]">
      {first} {rest.length > 0 && <span style={accent}>{rest.join(" ")}</span>}
    </span>
  );
}

// ---------------------------------------------------------------- blocos

type Env = { page: SalesPage; offer: Offer; ctx: SalesContext; hasOfferCard: boolean };

function ctaHref(action: "offer" | "checkout", blockId: string, env: Env) {
  return action === "offer" && env.hasOfferCard ? "#oferta" : env.ctx.checkoutHref(blockId);
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="size-4" strokeWidth={0} style={{ fill: i <= Math.round(value) ? "#ffb020" : "color-mix(in srgb, var(--q-text) 18%, transparent)" }} />
      ))}
    </span>
  );
}

function Container({ children, size = "lg" }: { children: React.ReactNode; size?: "sm" | "md" | "lg" }) {
  const max = size === "sm" ? "max-w-3xl" : size === "md" ? "max-w-4xl" : "max-w-6xl";
  return <div className={`mx-auto w-full ${max} px-5 sm:px-8`}>{children}</div>;
}

function renderBlock(b: Block, env: Env): React.ReactNode {
  const { offer, ctx, page } = env;
  switch (b.type) {
    case "hero":
      return (
        <Container>
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-12">
            <div className="text-center lg:text-left">
              {b.badge && (
                <span
                  className="mb-4 sm:mb-6 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.72em] font-semibold uppercase tracking-[0.12em]"
                  style={{ borderColor: "color-mix(in srgb, var(--q-accent) 45%, transparent)", color: "var(--q-accent)" }}
                >
                  <BadgeCheck className="size-3.5" /> {b.badge}
                </span>
              )}
              <h1 className="text-balance text-[2em] font-black leading-[1.03] tracking-[-0.035em] sm:text-[3.3em]">{fill(b.headline, ctx)}</h1>
              {b.subheadline && <p className="mx-auto mt-4 max-w-xl text-[1.02em] leading-relaxed sm:mt-6 sm:text-[1.08em] lg:mx-0" style={muted}>{fill(b.subheadline, ctx)}</p>}
              <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8 lg:items-start">
                <BuyButton
                  href={ctaHref(b.ctaAction, b.id, env)}
                  purchase={!(b.ctaAction === "offer" && env.hasOfferCard)}
                  label={b.ctaLabel || offer.buttonLabel || "Quero acessar"}
                  note={b.showPrice && offer.priceCents > 0 ? <>Acesso por {money(offer.priceCents, offer.currency)}{offer.paymentTerms ? ` · ${offer.paymentTerms}` : ""}</> : undefined}
                />
              </div>
            </div>
            <HeroVisual offer={offer} brand={page.brand} block={b} />
          </div>
        </Container>
      );

    case "personalized": {
      const p = ctx.personal;
      if (p === null) return null; // visitante sem sessão: nada a personalizar
      if (p === undefined)
        return (
          <Container size="md">
            <div className="rounded-[var(--q-radius)] border border-dashed p-6 text-center text-[0.9em]" style={{ borderColor: hairline, ...muted }}>
              <b style={{ color: "var(--q-text)" }}>{b.eyebrow || "Resultado personalizado"}</b>
              <p className="mt-1">Este bloco mostra as respostas reais do visitante e as interpretações cujas condições forem atendidas. Use “Visualizar rascunho” para testar com respostas.</p>
            </div>
          </Container>
        );
      const items = b.summary.map((s) => ({ ...s, value: answerLabel(p.quiz, p.answers, s.questionId) })).filter((s) => s.value);
      const insights = matchedInsights(b, p);
      if (!items.length && !insights.length && !b.fallbackText) return null;
      return (
        <Container size="md">
          <div className="text-center">
            <Eyebrow center>{b.eyebrow}</Eyebrow>
            {b.title && <H2 center>{fill(b.title, ctx)}</H2>}
            {b.intro && <p className="mx-auto mt-4 max-w-2xl" style={muted}>{fill(b.intro, ctx)}</p>}
          </div>
          {items.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--q-radius)] border" style={{ borderColor: hairline, background: hairline }}>
              {items.map((s) => (
                <div key={s.id} className="flex flex-col gap-1 p-4 sm:p-5" style={{ background: "var(--q-surface)" }}>
                  <dt className="text-[0.66em] font-semibold uppercase tracking-[0.12em] sm:text-[0.72em]" style={muted}>{s.label}</dt>
                  <dd className="text-[0.92em] font-bold leading-snug sm:text-[1.05em]">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {insights.length > 0 ? (
            <div className="mt-8 space-y-3">
              {insights.map((i, idx) => (
                <div key={i.id} className="flex gap-4 rounded-[var(--q-radius)] p-5" style={{ background: "color-mix(in srgb, var(--q-accent) 8%, var(--q-surface))", border: "1px solid color-mix(in srgb, var(--q-accent) 25%, transparent)" }}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full text-[0.8em] font-black" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}>{idx + 1}</span>
                  <div>
                    {i.title && <p className="font-bold">{fill(i.title, ctx)}</p>}
                    {i.text && <p className="mt-1 text-[0.95em] leading-relaxed" style={muted}>{fill(i.text, ctx)}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            b.fallbackText && <p className="mt-8 text-center leading-relaxed" style={muted}>{fill(b.fallbackText, ctx)}</p>
          )}
        </Container>
      );
    }

    case "text": {
      const center = b.align === "center" && !b.showMockup;
      const content = (
        <div className={center ? "text-center" : ""}>
          <Eyebrow center={center}>{b.eyebrow}</Eyebrow>
          {b.title && (
            <H2 center={center} className={b.emphasis === "statement" ? "sm:!text-[2.9em]" : ""}>
              {fill(b.title, ctx)}
            </H2>
          )}
          {b.body && (
            <div className={`mt-6 text-[1.06em] ${b.emphasis === "statement" ? "border-l-2 pl-5 text-left" : ""}`} style={{ ...muted, borderColor: "var(--q-accent)" }}>
              <Paragraphs text={fill(b.body, ctx)} />
            </div>
          )}
          {b.bullets.length > 0 && (
            <ul className={`mt-8 grid gap-3 ${b.showMockup ? "sm:grid-cols-2" : "sm:grid-cols-2"} text-left`}>
              {b.bullets.map((it, i) => (
                <li key={i} className="flex items-center gap-3 border-b pb-3 text-[0.95em] font-semibold" style={{ borderColor: hairline }}>
                  <span className="size-1.5 shrink-0 rounded-full" style={{ background: "var(--q-accent)" }} />
                  {fill(it, ctx)}
                </li>
              ))}
            </ul>
          )}
        </div>
      );
      if (!b.showMockup) return <Container size="sm">{content}</Container>;
      return (
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
            <div className="order-2 flex justify-center md:order-1">
              <BookMockup title={offer.productName || page.brand.name || "Guia"} imageUrl={offer.coverImageUrl} checkoutUrl={offer.checkoutUrl} label="Guia prático" />
            </div>
            <div className="order-1 md:order-2">{content}</div>
          </div>
        </Container>
      );
    }

    case "headline":
      return (
        <Container size="sm">
          <h1 className={`text-balance text-[2em] font-extrabold leading-[1.1] tracking-tight sm:text-[2.4em] ${b.align === "center" ? "text-center" : ""}`}>{fill(b.text, ctx)}</h1>
        </Container>
      );
    case "subheadline":
      return (
        <Container size="sm">
          <p className={`text-[1.15em] leading-relaxed ${b.align === "center" ? "text-center" : ""}`} style={muted}>{fill(b.text, ctx)}</p>
        </Container>
      );
    case "image":
    case "mockup":
      if (!usableImageUrl(b.url, offer.checkoutUrl)) {
        if (b.type !== "mockup") return null;
        return (
          <Container>
            <div className="flex justify-center"><BookMockup title={offer.productName || page.brand.name || "Guia"} imageUrl={offer.coverImageUrl} checkoutUrl={offer.checkoutUrl} /></div>
            {b.caption && <p className="mt-6 text-center text-[0.9em]" style={muted}>{b.caption}</p>}
          </Container>
        );
      }
      return (
        <Container size="md">
          <figure className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={b.type === "image" ? b.alt : b.caption} loading="lazy" className="mx-auto w-full rounded-[var(--q-radius)] object-contain" />
            {b.type === "mockup" && b.caption && <figcaption className="text-center text-[0.9em]" style={muted}>{b.caption}</figcaption>}
          </figure>
        </Container>
      );
    case "video": {
      const e = embedUrl(b.url);
      if (!e) return null;
      return (
        <Container size="md">
          <div className="aspect-video w-full overflow-hidden rounded-[var(--q-radius)] bg-black">
            {e.kind === "iframe" ? (
              <iframe src={e.src} className="h-full w-full" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" title="Vídeo" />
            ) : (
              <video src={e.src} controls preload="metadata" className="h-full w-full" />
            )}
          </div>
        </Container>
      );
    }
    case "benefits": {
      const items = b.useOffer ? offer.benefits : b.items;
      if (!items.length) return null;
      return (
        <Container size="md">
          {b.title && <H2 center>{fill(b.title, ctx)}</H2>}
          <ul className="mt-10 grid gap-3 sm:grid-cols-2">
            {items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 rounded-[var(--q-radius)] border px-4 py-3 sm:py-4" style={{ borderColor: hairline }}>
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full" style={{ background: "color-mix(in srgb, var(--q-accent) 18%, transparent)" }}>
                  <Check className="size-3.5" style={accent} strokeWidth={3} />
                </span>
                <span className="leading-snug">{it}</span>
              </li>
            ))}
          </ul>
        </Container>
      );
    }
    case "content":
      if (!b.items.length) return null;
      return (
        <Container size={b.numbered ? "lg" : "md"}>
          <div className="text-center">
            <Eyebrow center>{b.eyebrow}</Eyebrow>
            {b.title && <H2 center>{fill(b.title, ctx)}</H2>}
          </div>
          {b.numbered ? (
            <ol className="mt-12 grid gap-x-10 sm:grid-cols-2">
              {b.items.map((it, i) => (
                <li key={i} className="flex gap-5 border-t py-6" style={{ borderColor: hairline }}>
                  <span className="text-[2.2em] font-black leading-none tabular-nums" style={{ color: "transparent", WebkitTextStroke: "1.5px var(--q-accent)" }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-[0.7em] font-bold uppercase tracking-[0.16em]" style={accent}>Capítulo {String(i + 1).padStart(2, "0")}</p>
                    <p className="mt-1 text-[1.08em] font-extrabold uppercase tracking-tight">{it.title}</p>
                    {it.description && <p className="mt-1.5 text-[0.95em] leading-relaxed" style={muted}>{it.description}</p>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-10 space-y-3">
              {b.items.map((it, i) => (
                <div key={i} className="rounded-[var(--q-radius)] p-5" style={{ background: "var(--q-surface)" }}>
                  <p className="font-bold">{it.title}</p>
                  {it.description && <p className="mt-1 text-[0.95em] leading-relaxed" style={muted}>{it.description}</p>}
                </div>
              ))}
            </div>
          )}
        </Container>
      );
    case "bonuses":
      if (!offer.bonuses.length) return null; // só exibe bônus cadastrados na oferta
      return (
        <Container>
          {b.title && <H2 center>{b.title}</H2>}
          <div className="mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4">
            {offer.bonuses.map((bonus, i) => (
              <div key={i} className="flex flex-col items-center rounded-[var(--q-radius)] border p-4 text-center sm:p-6" style={{ borderColor: hairline, background: "var(--q-surface)" }}>
                <div className="flex h-[130px] items-center sm:h-[170px]"><BookMockup size="md" title={bonus.title} label={`Bônus ${String(i + 1).padStart(2, "0")}`} imageUrl={bonus.imageUrl} checkoutUrl={offer.checkoutUrl} /></div>
                <p className="mt-4 text-[0.7em] font-bold uppercase tracking-[0.16em]" style={accent}>
                  <Gift className="mr-1 inline size-3.5 -translate-y-px" />Bônus {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 text-[0.85em] font-extrabold uppercase leading-tight tracking-tight sm:text-[1em]">{bonus.title}</p>
                {bonus.description && <p className="mt-2 text-[0.8em] leading-relaxed sm:text-[0.9em]" style={muted}>{bonus.description}</p>}
              </div>
            ))}
          </div>
        </Container>
      );
    case "preview": {
      const items = b.items.filter((it) => usableImageUrl(it.imageUrl));
      if (items.length === 0) return null;
      return (
        <Container>
          <div className="text-center">
            {b.eyebrow && <Eyebrow center>{b.eyebrow}</Eyebrow>}
            <H2 center>{b.title}</H2>
            {b.subtitle && <p className="mx-auto mt-3 max-w-2xl leading-relaxed" style={muted}>{b.subtitle}</p>}
          </div>
          <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [scrollbar-width:none]">
            {items.map((it, i) => (
              <figure key={i} className="flex w-[86%] shrink-0 snap-center flex-col sm:w-auto">
                <a
                  href={it.imageUrl}
                  target="_blank"
                  rel="noopener"
                  aria-label={`Ampliar trecho: ${it.title}`}
                  className="relative block overflow-hidden rounded-[10px] bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,.8)]"
                  style={{ border: "1px solid rgba(255,255,255,.12)" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.imageUrl} alt={`Trecho do material: ${it.title}`} loading="lazy" decoding="async" className="block max-h-[460px] w-full object-cover object-top" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28" style={{ background: "linear-gradient(transparent, #fff 78%)" }} />
                  <span className="absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.66em] font-extrabold uppercase tracking-[0.1em]" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}>
                    <BookOpen className="size-3" /> Trecho real
                  </span>
                  <span className="absolute bottom-3.5 right-3 z-10 text-[0.68em] font-bold text-zinc-500">Toque para ampliar</span>
                </a>
                <figcaption className="mt-3 px-1">
                  <b className="block text-[0.98em]">{it.title}</b>
                  {it.caption && <span className="mt-1 block text-[0.88em] leading-relaxed" style={muted}>{it.caption}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
          {b.note && <p className="mt-4 text-center text-[0.78em]" style={muted}>{b.note}</p>}
        </Container>
      );
    }
    case "deliverables": {
      const main = offer.productName || page.brand.name || "Guia";
      const screen = usableImageUrl(b.screenImageUrl);
      const fmtIcons = [Download, Laptop, Smartphone, Zap];
      return (
        <Container>
          <div className="text-center">
            {b.eyebrow && <Eyebrow center>{b.eyebrow}</Eyebrow>}
            <H2 center>{b.title}</H2>
            {b.subtitle && <p className="mx-auto mt-3 max-w-2xl leading-relaxed" style={muted}>{b.subtitle}</p>}
          </div>
          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            {/* composição: guia principal + bônus + tela do celular */}
            <div className="relative mx-auto w-full max-w-[520px]">
              <div className="flex items-end justify-center gap-2 sm:gap-4">
                <div className="relative z-10 -mr-3 sm:-mr-2">
                  <BookMockup title={main} label="Guia principal" imageUrl={offer.coverImageUrl} checkoutUrl={offer.checkoutUrl} />
                </div>
                {screen && (
                  <div className="relative z-20 mb-[-6px] w-[118px] shrink-0 rotate-[6deg] overflow-hidden rounded-[22px] border-[5px] bg-white shadow-[0_30px_60px_-20px_rgba(0,0,0,.9)] sm:w-[150px]" style={{ borderColor: "#26262b", aspectRatio: "9 / 19" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screen} alt="O material aberto no celular" loading="lazy" className="h-full w-full object-cover object-top" />
                  </div>
                )}
              </div>
              {offer.bonuses.length > 0 && (
                <div className="mt-12 grid grid-cols-4 gap-2 sm:mt-8 sm:gap-3">
                  {offer.bonuses.slice(0, 4).map((bonus, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 text-center">
                      <div className="flex h-[96px] items-center sm:h-[130px]">
                        <BookMockup size="md" title={bonus.title} label={`Bônus ${String(i + 1).padStart(2, "0")}`} imageUrl={bonus.imageUrl} checkoutUrl={offer.checkoutUrl} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* lista do que chega + formato de entrega */}
            <div>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-3 rounded-[var(--q-radius)] border px-4 py-3" style={{ borderColor: "color-mix(in srgb, var(--q-accent) 45%, transparent)", background: "color-mix(in srgb, var(--q-accent) 8%, var(--q-surface))" }}>
                  <BookOpen className="size-5 shrink-0" style={accent} />
                  <span className="flex-1"><b>{main}</b><span className="block text-[0.85em]" style={muted}>Guia principal{offer.benefits.length ? ` · ${offer.benefits.length} capítulos` : ""}</span></span>
                </li>
                {offer.bonuses.map((bonus, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-[var(--q-radius)] border px-4 py-3" style={{ borderColor: hairline, background: "var(--q-surface)" }}>
                    <Gift className="size-5 shrink-0" style={accent} />
                    <span className="flex-1"><b>{bonus.title}</b>{bonus.description && <span className="block text-[0.85em] leading-snug" style={muted}>{bonus.description}</span>}</span>
                  </li>
                ))}
              </ul>
              {b.formats.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                  {b.formats.map((f, i) => {
                    const Icon = fmtIcons[i % fmtIcons.length];
                    return (
                      <div key={i} className="flex items-center gap-2 rounded-[var(--q-radius)] px-3 py-2.5 text-[0.82em] font-semibold" style={{ background: "color-mix(in srgb, var(--q-text) 5%, transparent)" }}>
                        <Icon className="size-4 shrink-0" style={accent} /> {f}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Container>
      );
    }
    case "fit":
      return (
        <Container size="md">
          <H2 center>{b.title}</H2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[var(--q-radius)] border p-5" style={{ borderColor: "color-mix(in srgb, var(--q-accent) 45%, transparent)", background: "color-mix(in srgb, var(--q-accent) 7%, var(--q-surface))" }}>
              <p className="mb-3 font-extrabold">{b.yesTitle}</p>
              <ul className="space-y-2.5">
                {b.yes.map((it, i) => (
                  <li key={i} className="flex gap-2.5 text-[0.95em] leading-snug"><Check className="mt-0.5 size-4 shrink-0" style={accent} strokeWidth={3} />{it}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[var(--q-radius)] border p-5" style={{ borderColor: hairline, background: "var(--q-surface)" }}>
              <p className="mb-3 font-extrabold">{b.noTitle}</p>
              <ul className="space-y-2.5">
                {b.no.map((it, i) => (
                  <li key={i} className="flex gap-2.5 text-[0.95em] leading-snug" style={muted}><X className="mt-0.5 size-4 shrink-0" strokeWidth={3} />{it}</li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      );
    case "reviews": {
      const sp = ctx.social;
      if (!sp)
        return (
          <Container size="md">
            <div className="rounded-[var(--q-radius)] border border-dashed p-6 text-center text-[0.9em]" style={{ borderColor: hairline, ...muted }}>
              <b style={{ color: "var(--q-text)" }}>{b.title}</b>
              <p className="mt-1">Mostra automaticamente as avaliações de compradores aprovadas na aba “Avaliações” e o total real de vendas confirmadas. Fica oculto enquanto não houver avaliações aprovadas.</p>
            </div>
          </Container>
        );
      const items = sp.reviews.slice(0, b.maxItems);
      const showBuyers = b.showBuyerCount && sp.buyers >= b.minBuyers;
      if (items.length === 0 && !showBuyers) return null;
      return (
        <Container>
          <div className="text-center">
            <H2 center>{b.title}</H2>
            {b.subtitle && <p className="mx-auto mt-3 max-w-xl" style={muted}>{b.subtitle}</p>}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {sp.average != null && sp.reviewCount > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[0.85em] font-bold" style={{ borderColor: hairline }}>
                  <Stars value={sp.average} />
                  {sp.average.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} de 5 · {sp.reviewCount} {sp.reviewCount === 1 ? "avaliação" : "avaliações"}
                </span>
              )}
              {showBuyers && (
                <span className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.85em] font-bold" style={{ background: "color-mix(in srgb, var(--q-accent) 16%, transparent)", ...accent }}>
                  <Users className="size-4" /> {sp.buyers.toLocaleString("pt-BR")} {b.buyerLabel}
                </span>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 [scrollbar-width:none]">
              {items.map((r) => (
                <figure
                  key={r.id}
                  className="flex w-[82%] shrink-0 snap-center flex-col rounded-[var(--q-radius)] border p-5 sm:w-auto"
                  style={{ borderColor: hairline, background: "color-mix(in srgb, var(--q-surface) 85%, transparent)" }}
                >
                  <Stars value={r.rating} />
                  <blockquote className="mt-3 flex-1 text-[0.95em] leading-relaxed">“{r.text}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full text-[0.85em] font-extrabold" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}>
                      {r.name.charAt(0)}
                    </span>
                    <span className="min-w-0 text-[0.85em]">
                      <b className="block truncate">{r.name}{r.city ? ` · ${r.city}` : ""}</b>
                      {r.verified && (
                        <span className="inline-flex items-center gap-1 text-[0.9em] font-semibold" style={accent}>
                          <BadgeCheck className="size-3.5" /> Compra verificada
                        </span>
                      )}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {items.length > 0 && <p className="mt-4 text-center text-[0.72em]" style={muted}>Avaliações enviadas por compradores e publicadas com autorização. Experiências individuais; não representam garantia de resultado.</p>}
        </Container>
      );
    }
    case "testimonials":
      if (!b.items.length) return null;
      return (
        <Container>
          {b.title && <H2 center>{b.title}</H2>}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {b.items.map((t, i) => (
              <figure key={i} className="space-y-4 rounded-[var(--q-radius)] border p-5" style={{ borderColor: hairline, background: "var(--q-surface)" }}>
                <blockquote className="text-[0.95em] leading-relaxed">“{t.text}”</blockquote>
                <figcaption className="flex items-center gap-2.5 text-[0.85em]">
                  {t.avatarUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.avatarUrl} alt="" loading="lazy" className="size-8 rounded-full object-cover" />
                  )}
                  <span>
                    <span className="block font-semibold">{t.name}</span>
                    {t.role && <span className="block text-[0.85em]" style={muted}>{t.role}</span>}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      );
    case "faq":
      if (!b.items.length) return null;
      return (
        <Container size="sm">
          {b.title && <H2 center>{b.title}</H2>}
          <div className="mt-10 border-t" style={{ borderColor: hairline }}>
            {b.items.map((f, i) => (
              <details key={i} className="group border-b" style={{ borderColor: hairline }}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-[1.02em] font-bold [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <ChevronDown className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-180" style={accent} />
                </summary>
                <p className="pb-5 text-[0.95em] leading-relaxed whitespace-pre-line" style={muted}>{f.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      );
    case "offerCard": {
      const main = offer.productName || page.brand.name;
      const items = b.items.length ? b.items : [main ? `Guia principal: ${main}` : "Produto principal", ...offer.bonuses.map((x) => x.title)];
      const hasRef = offer.referencePriceCents != null && offer.referencePriceCents > offer.priceCents && offer.referencePriceNote;
      return (
        <Container size="md">
          <div
            id="oferta"
            data-offer=""
            className="relative scroll-mt-6 overflow-hidden rounded-[calc(var(--q-radius)+6px)] border p-6 sm:p-10"
            style={{
              borderColor: "color-mix(in srgb, var(--q-accent) 45%, transparent)",
              background: "radial-gradient(120% 80% at 100% 0%, color-mix(in srgb, var(--q-accent) 14%, transparent), transparent 60%), var(--q-surface)",
              boxShadow: "0 30px 80px -30px color-mix(in srgb, var(--q-accent) 45%, transparent)",
            }}
          >
            <div className="grid items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
              <div className="relative flex justify-center py-4">
                <BookMockup title={offer.productName || page.brand.name || "Guia"} imageUrl={offer.coverImageUrl} checkoutUrl={offer.checkoutUrl} label="Guia prático" />
                {offer.bonuses.length > 0 && (
                  <span className="absolute bottom-0 right-2 rounded-full px-3 py-1 text-[0.72em] font-extrabold uppercase" style={{ background: "var(--q-accent)", color: "var(--q-accent-text)" }}>
                    + {offer.bonuses.length} bônus
                  </span>
                )}
              </div>
              <div>
                <p className="text-[0.72em] font-bold uppercase tracking-[0.18em]" style={accent}>{b.title}</p>
                <ul className="mt-5 space-y-2.5">
                  {items.map((it, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-[var(--q-radius)] border px-3 py-2.5 text-[0.95em]"
                      style={{ borderColor: hairline, background: "color-mix(in srgb, var(--q-bg) 35%, transparent)" }}
                    >
                      <Check className="size-4 shrink-0" style={accent} strokeWidth={3} />
                      <span className="flex-1">{it}</span>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[0.66em] font-extrabold uppercase tracking-[0.08em]"
                        style={i === 0 ? { background: "var(--q-accent)", color: "var(--q-accent-text)" } : { border: `1px solid ${hairline}`, ...accent }}
                      >
                        {i === 0 ? "Principal" : "Incluso"}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-7 border-t pt-6" style={{ borderColor: hairline }}>
                  {hasRef ? (
                    <p className="text-[0.9em]" style={muted}>
                      De <s>{money(offer.referencePriceCents!, offer.currency)}</s> por
                    </p>
                  ) : (
                    items.length > 1 && <p className="text-[0.9em] font-semibold" style={muted}>Tudo isso, {items.length} materiais, por</p>
                  )}
                  <p className="text-[3em] font-black leading-none tracking-[-0.04em]">{money(offer.priceCents, offer.currency)}</p>
                  {items.length > 1 && offer.priceCents > 0 && (
                    <p
                      className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.78em] font-bold"
                      style={{ background: "color-mix(in srgb, var(--q-accent) 16%, transparent)", ...accent }}
                    >
                      Equivale a {money(Math.round(offer.priceCents / items.length), offer.currency)} por material
                    </p>
                  )}
                  {offer.paymentTerms && <p className="mt-2 text-[0.9em] font-semibold" style={muted}>{offer.paymentTerms}</p>}
                  {hasRef && <p className="mt-1 text-[0.72em]" style={muted}>Preço de referência: {offer.referencePriceNote}</p>}
                </div>
                <div className="mt-6">
                  <BuyButton wide href={ctx.checkoutHref(b.id)} label={b.buttonLabel || offer.buttonLabel || "Comprar"} note={b.note ? <><Lock className="size-3.5" /> {b.note}</> : undefined} />
                </div>
              </div>
            </div>
          </div>
        </Container>
      );
    }
    case "price": {
      const hasRef = offer.referencePriceCents != null && offer.referencePriceCents > offer.priceCents && offer.referencePriceNote;
      return (
        <Container size="sm">
          <div data-offer="" className="space-y-2 rounded-[var(--q-radius)] p-6 text-center" style={{ background: "var(--q-surface)" }}>
            {b.title && <p className="text-[0.8em] font-semibold uppercase tracking-wide" style={muted}>{b.title}</p>}
            {hasRef && <p className="text-[0.9em]" style={muted}>De <s>{money(offer.referencePriceCents!, offer.currency)}</s> por</p>}
            <p className="text-[2.4em] font-extrabold leading-none tracking-tight">{money(offer.priceCents, offer.currency)}</p>
            {offer.paymentTerms && <p className="text-[0.9em]" style={muted}>{offer.paymentTerms}</p>}
            {hasRef && <p className="text-[0.7em]" style={muted}>Preço de referência: {offer.referencePriceNote}</p>}
          </div>
        </Container>
      );
    }
    case "cta":
      return (
        <Container size="sm">
          <div className="text-center">
            <BuyButton href={ctx.checkoutHref(b.id)} label={b.label || offer.buttonLabel || "Comprar"} note={b.note || undefined} />
          </div>
        </Container>
      );
    case "guarantee": {
      const text = b.text || offer.guarantee;
      if (!text && !offer.guaranteeDays) return null; // nunca inventa garantia
      return (
        <Container size="sm">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:text-left">
            <div className="grid size-16 shrink-0 place-items-center rounded-full border-2" style={{ borderColor: "var(--q-accent)" }}>
              <ShieldCheck className="size-8" style={accent} />
            </div>
            <div>
              <p className="text-[1.3em] font-extrabold uppercase tracking-tight">{b.title}</p>
              {offer.guaranteeDays && <p className="mt-1 font-bold" style={accent}>Garantia de {offer.guaranteeDays} dias</p>}
              {text && <p className="mt-2 leading-relaxed whitespace-pre-line" style={muted}>{text}</p>}
            </div>
          </div>
        </Container>
      );
    }
    case "ctaSection":
      return (
        <Container size="sm">
          <div className="text-center">
            <H2 center>{fill(b.headline, ctx)}</H2>
            {b.subheadline && <p className="mx-auto mt-5 max-w-xl text-[1.06em]" style={muted}>{fill(b.subheadline, ctx)}</p>}
            <div className="mt-8 flex justify-center">
              <BuyButton href={ctaHref(b.ctaAction, b.id, env)} purchase={!(b.ctaAction === "offer" && env.hasOfferCard)} label={b.buttonLabel || offer.buttonLabel || "Comprar"} />
            </div>
          </div>
        </Container>
      );
    case "footer": {
      const legal = ctx.legal;
      return (
        <Container>
          <footer className="flex flex-col items-center gap-5 border-t pt-10 text-center text-[0.8em] leading-relaxed" style={{ borderColor: hairline, ...muted }}>
            <div style={{ color: "var(--q-text)" }}><BrandMark brand={page.brand} /></div>
            <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              <a href="/privacidade" className="hover:underline">Política de Privacidade</a>
              {legal?.hasTerms && <a href="/termos" className="hover:underline">Termos de Uso</a>}
              {legal?.contactEmail && <a href={`mailto:${legal.contactEmail}`} className="hover:underline">Contato</a>}
            </nav>
            {legal?.controllerName && (
              <p>
                {legal.controllerName}
                {legal.document && ` · ${legal.document}`}
                {legal.contactEmail && ` · ${legal.contactEmail}`}
              </p>
            )}
            {b.text && <p className="max-w-2xl whitespace-pre-line">{b.text}</p>}
          </footer>
        </Container>
      );
    }
  }
}

const toneStyle = (tone: Block["tone"], fx = false): React.CSSProperties =>
  tone === "surface"
    ? { background: fx ? "color-mix(in srgb, var(--q-surface) 72%, transparent)" : "var(--q-surface)" }
    : tone === "contrast"
      ? { background: "var(--q-text)", color: "var(--q-bg)", "--q-surface": "color-mix(in srgb, var(--q-bg) 6%, var(--q-text))", "--q-muted": "color-mix(in srgb, var(--q-bg) 65%, var(--q-text))", "--q-text": "var(--q-bg)" } as React.CSSProperties
      : {};

export function SalesPageView({
  page,
  offer,
  ctx,
  minHeight = "100dvh",
  motion = "full",
}: {
  page: SalesPage;
  offer: Offer;
  ctx: SalesContext;
  minHeight?: string;
  /** full = página pública (efeitos ligados ao scroll); static = pré-visualização dentro do painel */
  motion?: "full" | "static";
}) {
  const blocks = visibleBlocks(page.blocks, ctx.profile?.id ?? null);
  const env: Env = { page, offer, ctx, hasOfferCard: blocks.some((b) => b.type === "offerCard") };
  const showBrandBar = (page.brand.name || page.brand.logoUrl) && blocks[0]?.type === "hero";
  const fx = page.effects;
  const rootId = "fos-sales";
  return (
    <div
      id={motion === "full" ? rootId : undefined}
      style={{ ...themeVars(page.theme), minHeight }}
      className={`relative isolate overflow-x-hidden antialiased ${fx ? `fx-page ${motion === "static" ? "fx-static" : ""}` : ""}`}
    >
      {fx && <SalesBackdrop />}
      {fx && motion === "full" && <SalesFx rootId={rootId} />}
      {showBrandBar && (
        <header className="mx-auto flex max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
          <BrandMark brand={page.brand} />
          <span className="hidden items-center gap-1.5 text-[0.72em] font-semibold uppercase tracking-[0.14em] sm:flex" style={muted}>
            <Briefcase className="size-3.5" /> {page.brand.tagline || "Produto digital"}
          </span>
        </header>
      )}
      {blocks.map((b, i) => {
        const node = renderBlock(b, env);
        if (!node) return null;
        const first = i === 0;
        return (
          <section
            key={b.id}
            data-block={b.type}
            className={`reveal ${b.type === "footer" ? "pb-10 pt-4" : first ? "pb-10 pt-7 sm:pb-24 sm:pt-14" : "py-[calc(4rem*var(--q-space))] sm:py-[calc(5.5rem*var(--q-space))]"}`}
            style={toneStyle(b.tone, fx)}
          >
            {node}
            {fx && first && b.type === "hero" && <LiquidWave />}
          </section>
        );
      })}
      {blocks.length === 0 && <p className="p-10 text-center" style={muted}>Página sem blocos.</p>}
    </div>
  );
}

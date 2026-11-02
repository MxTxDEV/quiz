import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedCampaignBySlug } from "@/lib/services/campaigns";
import { REVIEW_CONSENT_TEXT } from "@/lib/services/reviews";
import { themeVars } from "@/components/public/theme";
import { ReviewForm } from "@/components/public/review-form";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getPublishedCampaignBySlug((await params).slug);
  const name = c?.config.offer.productName || c?.config.salesPage.brand.name || "o produto";
  return { title: { absolute: `Avalie ${name}` }, robots: { index: false } };
}

export default async function ReviewPage({ params }: Props) {
  const c = await getPublishedCampaignBySlug((await params).slug);
  if (!c) notFound();
  const { salesPage, offer } = c.config;
  const name = offer.productName || salesPage.brand.name || c.name;
  return (
    <main style={{ ...themeVars(salesPage.theme), minHeight: "100dvh" }} className="px-5 py-10 antialiased">
      <div className="mx-auto max-w-lg">
        <p className="text-center text-[0.72em] font-bold uppercase tracking-[0.18em]" style={{ color: "var(--q-accent)" }}>Sua opinião</p>
        <h1 className="mt-2 text-balance text-center text-[1.9em] font-black leading-tight tracking-tight">Como está sendo sua experiência com o {name}?</h1>
        <p className="mt-3 text-center text-[0.98em] leading-relaxed" style={{ color: "var(--q-muted)" }}>
          Leva menos de 1 minuto. Sua avaliação ajuda outras pessoas a decidirem — seja sincero, inclusive se algo puder melhorar.
        </p>
        <ReviewForm slug={c.slug} consentText={REVIEW_CONSENT_TEXT} />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getPublishedCampaignBySlug } from "@/lib/services/campaigns";
import { getSessionProfile, PublicFlowError } from "@/lib/services/public-flow";
import { getSetting } from "@/lib/services/settings";
import { SalesPageView, type PersonalData } from "@/components/public/sales-page";
import { TrackingScripts } from "@/components/public/tracking-scripts";
import { SalesTracker } from "@/components/public/sales-tracker";
import type { Answers, Attributes } from "@/lib/engine/answers";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCampaignBySlug(slug);
  if (!c) return { title: "Oferta" };
  const hero = c.config.salesPage.blocks.find((b) => b.type === "hero" || b.type === "headline");
  const text = hero?.type === "hero" ? hero.headline : hero?.type === "headline" ? hero.text : "";
  const title = c.config.salesPage.brand.name || c.config.offer.productName || text.replace(/\{\{.*?\}\}/g, "") || c.name;
  return { title: { absolute: title }, description: c.config.salesPage.brand.tagline || undefined, robots: { index: false } };
}

export default async function OfferPage({ params, searchParams }: Props) {
  const [{ slug }, { s }] = await Promise.all([params, searchParams]);
  const campaign = await getPublishedCampaignBySlug(slug);
  if (!campaign) notFound();

  // sessão válida → personaliza com o perfil e as respostas reais; sem sessão → versão geral
  let sessionId: string | null = null;
  let profile: { id: string; name: string } | null = null;
  let personal: PersonalData | null = null;
  if (s && z.string().uuid().safeParse(s).success) {
    try {
      const res = await getSessionProfile(s);
      if (res.session.campaignId === campaign.id) {
        sessionId = res.session.id;
        profile = res.profile ? { id: res.profile.id, name: res.profile.name } : null;
        if (res.session.completedAt)
          personal = {
            quiz: campaign.config.quiz,
            answers: res.session.answers as Answers,
            attributes: res.session.attributes as Attributes,
            score: res.session.score,
          };
      }
    } catch (e) {
      if (!(e instanceof PublicFlowError)) throw e;
    }
  }
  const privacy = await getSetting("privacy");
  const { offer, salesPage, tracking } = campaign.config;
  const checkoutHref = (blockId: string) =>
    sessionId ? `/api/public/checkout?s=${sessionId}&b=${encodeURIComponent(blockId)}` : offer.checkoutUrl || "#";

  return (
    <>
      <SalesPageView
        page={salesPage}
        offer={offer}
        ctx={{
          profile,
          checkoutHref,
          personal,
          legal: { controllerName: privacy.controllerName, document: privacy.document, contactEmail: privacy.contactEmail, hasTerms: !!privacy.termsText },
        }}
      />
      <SalesTracker sessionId={sessionId} profile={profile?.name ?? null} value={offer.priceCents / 100} />
      <TrackingScripts tracking={tracking} />
    </>
  );
}

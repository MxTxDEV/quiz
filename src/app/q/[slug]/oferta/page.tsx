import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getPublishedCampaignBySlug } from "@/lib/services/campaigns";
import { getSessionProfile, PublicFlowError } from "@/lib/services/public-flow";
import { SalesPageView } from "@/components/public/sales-page";
import { TrackingScripts } from "@/components/public/tracking-scripts";
import { OfferBeacon } from "@/components/public/offer-beacon";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ s?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCampaignBySlug(slug);
  const h = c?.config.salesPage.blocks.find((b) => b.type === "headline");
  return { title: { absolute: h && h.type === "headline" ? h.text.replace(/\{\{.*?\}\}/g, "") : c?.name ?? "Oferta" }, robots: { index: false } };
}

export default async function OfferPage({ params, searchParams }: Props) {
  const [{ slug }, { s }] = await Promise.all([params, searchParams]);
  const campaign = await getPublishedCampaignBySlug(slug);
  if (!campaign) notFound();

  // sessão válida → personaliza pelo perfil; sem sessão → versão geral (blocos sem restrição de perfil)
  let sessionId: string | null = null;
  let profile: { id: string; name: string } | null = null;
  if (s && z.string().uuid().safeParse(s).success) {
    try {
      const res = await getSessionProfile(s);
      if (res.session.campaignId === campaign.id) {
        sessionId = res.session.id;
        profile = res.profile ? { id: res.profile.id, name: res.profile.name } : null;
      }
    } catch (e) {
      if (!(e instanceof PublicFlowError)) throw e;
    }
  }
  const { offer, salesPage, tracking } = campaign.config;
  const checkoutHref = (blockId: string) =>
    sessionId ? `/api/public/checkout?s=${sessionId}&b=${encodeURIComponent(blockId)}` : offer.checkoutUrl || "#";

  return (
    <>
      <SalesPageView page={salesPage} offer={offer} ctx={{ profile, checkoutHref }} />
      <OfferBeacon sessionId={sessionId} profile={profile?.name ?? null} value={offer.priceCents / 100} />
      <TrackingScripts tracking={tracking} />
    </>
  );
}

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPublishedCampaignBySlug } from "@/lib/services/campaigns";
import { toPublicCampaign } from "@/lib/domain/public";
import { LiveQuiz } from "@/components/public/live-quiz";
import { TrackingScripts } from "@/components/public/tracking-scripts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublishedCampaignBySlug(slug);
  if (!c) return { title: "Página não encontrada" };
  return {
    title: { absolute: c.config.quiz.intro.title || c.name },
    description: c.config.quiz.intro.subtitle.slice(0, 160),
    robots: { index: false },
  };
}

export default async function PublicQuizPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const c = await getPublishedCampaignBySlug(slug);
  if (!c) notFound();
  // campanha configurada para ir direto à página de vendas: mantém UTMs/fbclid no redirecionamento
  if (c.config.salesPage.skipQuiz) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (typeof v === "string" && k !== "s") qs.set(k, v.slice(0, 500));
    redirect(`/q/${encodeURIComponent(slug)}/oferta${qs.size ? `?${qs}` : ""}`);
  }
  return (
    <>
      <LiveQuiz campaign={toPublicCampaign(c)} />
      <TrackingScripts tracking={c.config.tracking} />
    </>
  );
}

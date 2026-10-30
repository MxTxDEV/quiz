import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublishedCampaignBySlug } from "@/lib/services/campaigns";
import { toPublicCampaign } from "@/lib/domain/public";
import { LiveQuiz } from "@/components/public/live-quiz";
import { TrackingScripts } from "@/components/public/tracking-scripts";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

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

export default async function PublicQuizPage({ params }: Props) {
  const { slug } = await params;
  const c = await getPublishedCampaignBySlug(slug);
  if (!c) notFound();
  return (
    <>
      <LiveQuiz campaign={toPublicCampaign(c)} />
      <TrackingScripts tracking={c.config.tracking} />
    </>
  );
}

import { QuizBuilder } from "@/components/admin/quiz-builder";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Quiz Builder" };

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  return <QuizBuilder campaignId={c.id} slug={c.slug} config={c.config} canEdit={hasRole(user, "editor")} />;
}

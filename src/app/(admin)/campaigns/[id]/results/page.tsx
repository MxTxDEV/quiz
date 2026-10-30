import { ResultsEditor } from "@/components/admin/results-editor";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Resultados e regras" };

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  return <ResultsEditor campaignId={c.id} config={c.config} canEdit={hasRole(user, "editor")} />;
}

import { TrackingEditor } from "@/components/admin/tracking-editor";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import { getSetting } from "@/lib/services/settings";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Rastreamento" };

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c, global] = await Promise.all([requireUser(), loadCampaign(id), getSetting("tracking")]);
  return <TrackingEditor campaignId={c.id} value={c.config.tracking} global={global} canEdit={hasRole(user, "editor")} publicUrl={`${appUrl()}/q/${c.slug}`} />;
}

import Link from "next/link";
import { LeadCaptureEditor } from "@/components/admin/lead-capture-editor";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Leads e LGPD" };

export default async function CampaignLeadsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button asChild variant="outline" size="sm"><Link href={`/leads?campanha=${c.id}`}>Ver leads desta campanha</Link></Button>
      </div>
      <LeadCaptureEditor campaignId={c.id} value={c.config.leadCapture} canEdit={hasRole(user, "editor")} />
    </>
  );
}

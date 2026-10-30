import { CampaignHeader } from "@/components/admin/campaign-header";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import { appUrl } from "@/lib/utils";
import { parseConfig } from "@/lib/domain/config";

export default async function CampaignLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  const unpublished = !!c.publishedConfig && JSON.stringify(parseConfig(c.publishedConfig)) !== JSON.stringify(c.config);
  return (
    <>
      <CampaignHeader
        id={c.id}
        name={c.name}
        slug={c.slug}
        status={c.status}
        publicUrl={`${appUrl()}/q/${c.slug}`}
        unpublished={unpublished}
        canEdit={hasRole(user, "editor")}
        canDelete={hasRole(user, "owner")}
      />
      {children}
    </>
  );
}

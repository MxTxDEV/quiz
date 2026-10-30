import { PageHeader } from "@/components/ui/misc";
import { IntegrationsPanel } from "@/components/admin/integrations-panel";
import { getSetting } from "@/lib/services/settings";
import { listWebhooks } from "@/lib/services/integrations";
import { listCampaigns } from "@/lib/services/campaigns";
import { hasRole, requireUser } from "@/lib/auth/session";
import { appUrl } from "@/lib/utils";

export const metadata = { title: "Integrações" };

export default async function IntegrationsPage() {
  const [user, tracking, outgoing, hooks, campaigns] = await Promise.all([
    requireUser(),
    getSetting("tracking"),
    getSetting("outgoingWebhook"),
    listWebhooks(),
    listCampaigns(),
  ]);
  const isOwner = hasRole(user, "owner");
  return (
    <>
      <PageHeader title="Integrações" description="Pixels de rastreamento, confirmação de vendas e envio de dados para outros sistemas." />
      <IntegrationsPanel
        tracking={tracking}
        outgoing={isOwner ? outgoing : { ...outgoing, secret: "" }}
        hooks={hooks.map(({ endpoint: h, campaignName }) => ({
          id: h.id,
          provider: h.provider,
          name: h.name,
          secret: isOwner ? h.secret : "",
          active: h.active,
          campaignName,
          lastReceivedAt: h.lastReceivedAt?.toISOString() ?? null,
        }))}
        campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
        baseUrl={appUrl()}
        canEdit={isOwner}
      />
    </>
  );
}

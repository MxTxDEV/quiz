import { PreviewApp } from "@/components/admin/preview-app";
import { requireUser } from "@/lib/auth/session";
import { loadCampaign } from "@/lib/server/campaign";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pré-visualização", robots: { index: false } };

export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const c = await loadCampaign(id);
  return <PreviewApp id={c.id} slug={c.slug} name={c.name} config={c.config} />;
}

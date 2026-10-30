import { SalesPageEditor } from "@/components/admin/sales-page-editor";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import { getProduct } from "@/lib/services/products";

export const metadata = { title: "Página de vendas" };

export default async function SalesPageRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  const product = c.productId ? await getProduct(c.productId) : null;
  return <SalesPageEditor campaignId={c.id} config={c.config} product={product} canEdit={hasRole(user, "editor")} />;
}

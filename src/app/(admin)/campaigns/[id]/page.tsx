import { CampaignGeneral } from "@/components/admin/campaign-general";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import { listProducts } from "@/lib/services/products";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c, products] = await Promise.all([requireUser(), loadCampaign(id), listProducts()]);
  return (
    <CampaignGeneral
      id={c.id}
      meta={{ name: c.name, description: c.description, slug: c.slug, productId: c.productId }}
      products={products.map((p) => ({ id: p.product.id, name: p.product.name }))}
      theme={c.config.theme}
      dates={{ createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString(), publishedAt: c.publishedAt?.toISOString() ?? null }}
      canEdit={hasRole(user, "editor")}
    />
  );
}

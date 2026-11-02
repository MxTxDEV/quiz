import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import { listReviews, socialProof } from "@/lib/services/reviews";
import { appUrl } from "@/lib/utils";
import { ReviewsPanel } from "@/components/admin/reviews-panel";

export const metadata = { title: "Avaliações" };

export default async function CampaignReviewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  const [rows, sp] = await Promise.all([listReviews(c.id), socialProof(c.id)]);
  const hasBlock = c.config.salesPage.blocks.some((b) => b.type === "reviews");
  return (
    <ReviewsPanel
      campaignId={c.id}
      link={`${appUrl()}/avaliar/${c.slug}`}
      hasBlock={hasBlock}
      buyers={sp.buyers}
      canEdit={hasRole(user, "editor")}
      canDelete={hasRole(user, "owner")}
      reviews={rows.map((r) => ({ id: r.id, name: r.name, city: r.city, rating: r.rating, text: r.text, email: r.email ?? "", verified: r.verified, status: r.status, createdAt: r.createdAt.toISOString() }))}
    />
  );
}

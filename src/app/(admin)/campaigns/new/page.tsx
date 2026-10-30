import { PageHeader } from "@/components/ui/misc";
import { NewCampaignForm } from "@/components/admin/new-campaign-form";
import { requireUser } from "@/lib/auth/session";
import { listTemplates } from "@/lib/services/templates";
import { listProducts } from "@/lib/services/products";
import { parseConfig } from "@/lib/domain/config";

export const metadata = { title: "Nova campanha" };

export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  await requireUser("editor");
  const [{ template }, templates, products] = await Promise.all([searchParams, listTemplates(), listProducts()]);
  return (
    <>
      <PageHeader title="Nova campanha" description="Escolha como começar. Tudo poderá ser editado depois." />
      <NewCampaignForm
        initialTemplateId={templates.some((t) => t.id === template) ? template : undefined}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          isBuiltin: t.isBuiltin,
          questionCount: parseConfig(t.config).quiz.questions.length,
        }))}
        products={products.filter((p) => p.product.status === "active").map((p) => ({ id: p.product.id, name: p.product.name }))}
      />
    </>
  );
}

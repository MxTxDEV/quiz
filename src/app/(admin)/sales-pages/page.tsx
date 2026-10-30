import { PageHeader } from "@/components/ui/misc";
import { CampaignPicker } from "@/components/admin/campaign-picker";

export const metadata = { title: "Páginas de vendas" };

export default function SalesPagesIndex() {
  return (
    <>
      <PageHeader title="Páginas de vendas" description="Cada campanha tem sua página de vendas e sua oferta. Escolha qual editar." />
      <CampaignPicker section="sales-page" cta="Editar página" meta={() => "Página + oferta"} />
    </>
  );
}

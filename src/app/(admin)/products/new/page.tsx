import { PageHeader } from "@/components/ui/misc";
import { ProductForm } from "@/components/admin/product-form";
import { requireUser } from "@/lib/auth/session";

export const metadata = { title: "Novo produto" };

export default async function NewProductPage() {
  await requireUser("editor");
  return (
    <>
      <PageHeader title="Novo produto" />
      <ProductForm canEdit />
    </>
  );
}

import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/ui/misc";
import { ProductForm } from "@/components/admin/product-form";
import { getProduct } from "@/lib/services/products";
import { hasRole, requireUser } from "@/lib/auth/session";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();
  const [user, product] = await Promise.all([requireUser(), getProduct(id)]);
  if (!product) notFound();
  return (
    <>
      <PageHeader title={product.name} description="Alterações aqui não mudam ofertas de campanhas já criadas — cada campanha tem sua oferta." />
      <ProductForm product={product} canEdit={hasRole(user, "editor")} />
    </>
  );
}

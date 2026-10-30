import Link from "next/link";
import { Boxes, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { listProducts } from "@/lib/services/products";
import { formatMoney } from "@/lib/utils";

export const metadata = { title: "Produtos" };

export default async function ProductsPage() {
  const rows = await listProducts();
  return (
    <>
      <PageHeader
        title="Produtos"
        description="Cadastre cada produto uma vez e reutilize em quantas campanhas quiser."
        actions={<Button asChild><Link href="/products/new"><Plus /> Novo produto</Link></Button>}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Boxes} title="Nenhum produto cadastrado" description="Produtos guardam preço, checkout, benefícios e bônus usados nas ofertas." action={<Button asChild variant="outline"><Link href="/products/new">Cadastrar produto</Link></Button>} />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr><Th>Produto</Th><Th>Categoria</Th><Th className="text-right">Preço</Th><Th className="text-right">Campanhas</Th><Th>Status</Th></tr>
            </thead>
            <tbody>
              {rows.map(({ product: p, campaignCount }) => (
                <tr key={p.id} className="hover:bg-muted/40">
                  <Td>
                    <Link href={`/products/${p.id}`} className="flex items-center gap-3 font-medium hover:underline">
                      {p.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImageUrl} alt="" className="size-8 rounded object-cover border" />
                      ) : (
                        <span className="size-8 rounded bg-muted grid place-items-center"><Boxes className="size-4 text-muted-foreground" /></span>
                      )}
                      {p.name}
                    </Link>
                  </Td>
                  <Td className="text-muted-foreground">{p.category || "—"}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(p.priceCents)}</Td>
                  <Td className="text-right tabular-nums">{campaignCount}</Td>
                  <Td><StatusBadge status={p.status} /></Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}

import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { CampaignMenu } from "@/components/admin/campaign-actions";
import { listCampaigns } from "@/lib/services/campaigns";
import { hasRole, requireUser } from "@/lib/auth/session";
import { appUrl, formatDate } from "@/lib/utils";

export const metadata = { title: "Campanhas" };

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<{ arquivadas?: string }> }) {
  const sp = await searchParams;
  const showArchived = sp.arquivadas === "1";
  const [user, rows] = await Promise.all([requireUser(), listCampaigns({ includeArchived: showArchived })]);
  const list = showArchived ? rows.filter((r) => r.status === "archived") : rows;
  return (
    <>
      <PageHeader
        title="Campanhas"
        description="Cada campanha tem quiz, regras, resultados, página de vendas e URL próprios."
        actions={
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href={showArchived ? "/campaigns" : "/campaigns?arquivadas=1"}>{showArchived ? "Ver ativas" : "Ver arquivadas"}</Link>
            </Button>
            <Button asChild><Link href="/campaigns/new"><Plus /> Nova campanha</Link></Button>
          </>
        }
      />
      {list.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={showArchived ? "Nenhuma campanha arquivada" : "Nenhuma campanha ainda"}
          description="Comece do zero ou a partir de um modelo pronto."
          action={!showArchived && <Button asChild variant="outline"><Link href="/campaigns/new">Criar campanha</Link></Button>}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead>
              <tr><Th>Campanha</Th><Th>Produto</Th><Th>URL</Th><Th className="text-right">Perguntas</Th><Th>Status</Th><Th>Atualizada</Th><Th className="w-10" /></tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <Td>
                    <Link href={`/campaigns/${c.id}`} className="font-medium hover:underline">{c.name}</Link>
                    {c.hasUnpublishedChanges && <Badge tone="warning" className="ml-2">Alterações não publicadas</Badge>}
                  </Td>
                  <Td className="text-muted-foreground">{c.productName ?? "—"}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">/q/{c.slug}</Td>
                  <Td className="text-right tabular-nums">{c.questionCount}</Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td className="text-muted-foreground whitespace-nowrap">{formatDate(c.updatedAt)}</Td>
                  <Td>
                    <CampaignMenu id={c.id} slug={c.slug} name={c.name} status={c.status} publicUrl={`${appUrl()}/q/${c.slug}`} canDelete={hasRole(user, "owner")} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </>
  );
}

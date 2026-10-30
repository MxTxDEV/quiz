import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { EraseByEmailForm, EraseLeadButton } from "@/components/admin/lead-actions";
import { listLeads } from "@/lib/services/leads";
import { listCampaigns } from "@/lib/services/campaigns";
import { hasRole, requireUser } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: { searchParams: Promise<{ campanha?: string; q?: string }> }) {
  const sp = await searchParams;
  const campaignId = sp.campanha && /^[0-9a-f-]{36}$/i.test(sp.campanha) ? sp.campanha : undefined;
  const [user, rows, campaigns] = await Promise.all([requireUser(), listLeads({ campaignId, search: sp.q?.slice(0, 100) }), listCampaigns({ includeArchived: true })]);
  const isOwner = hasRole(user, "owner");
  return (
    <>
      <PageHeader title="Leads" description="Dados pessoais coletados com consentimento. Acesso restrito a usuários autenticados." />
      <form className="mb-4 flex flex-wrap gap-2">
        <Select name="campanha" defaultValue={campaignId ?? ""} className="w-60">
          <option value="">Todas as campanhas</option>
          {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Input name="q" defaultValue={sp.q ?? ""} placeholder="Buscar por e-mail" className="w-60" />
        <Button type="submit" variant="outline">Filtrar</Button>
        {(campaignId || sp.q) && <Button asChild variant="ghost"><Link href="/leads">Limpar</Link></Button>}
      </form>
      {rows.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum lead" description="Ative a captura de leads na aba “Leads e LGPD” de uma campanha." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <thead><tr><Th>Nome</Th><Th>E-mail</Th><Th>Campanha</Th><Th>Perfil</Th><Th>Consentimento</Th><Th className="w-10" /></tr></thead>
            <tbody>
              {rows.map(({ lead: l, campaignName }) => (
                <tr key={l.id}>
                  <Td>{l.name ?? "—"}</Td>
                  <Td className="font-medium">{l.email}</Td>
                  <Td className="text-muted-foreground">{campaignName}</Td>
                  <Td className="font-mono text-xs text-muted-foreground">{l.profileId ?? "—"}</Td>
                  <Td className="text-muted-foreground whitespace-nowrap" title={l.consentText}>{formatDate(l.consentAt)}</Td>
                  <Td>{isOwner && <EraseLeadButton id={l.id} />}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
      {isOwner && (
        <Card className="mt-6">
          <CardHeader>
            <div>
              <CardTitle>Solicitação de exclusão (LGPD)</CardTitle>
              <CardDescription>Remove nome e e-mail de todos os leads com este endereço, em todas as campanhas.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="max-w-lg"><EraseByEmailForm /></CardContent>
        </Card>
      )}
    </>
  );
}

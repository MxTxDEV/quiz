import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { PeriodPicker } from "@/components/analytics/period-picker";
import { KpiGrid } from "@/components/analytics/kpis";
import { TrendChart } from "@/components/analytics/charts";
import { SegmentTable } from "@/components/analytics/segment-table";
import { businessDate, bySessionDimension, campaignComparison, dailySeries, funnelCounts, parseRange } from "@/lib/analytics/queries";
import { deriveMetrics } from "@/lib/analytics/metrics";
import { listPurchases } from "@/lib/services/purchases";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const [counts, series, rows, sources, purchases] = await Promise.all([
    funnelCounts(range),
    dailySeries(range),
    campaignComparison(range),
    bySessionDimension(range, null, "traffic_source"),
    listPurchases(20),
  ]);
  return (
    <>
      <PageHeader title="Analytics" description="Todas as campanhas. Para funil, abandono por pergunta e perfis, abra a analytics de cada campanha." />
      <div className="mb-4"><PeriodPicker current={range.key} from={businessDate(range.from)} to={businessDate(new Date(range.to.getTime() - 1))} /></div>
      <KpiGrid counts={counts} metrics={deriveMetrics(counts)} />
      <Card className="mt-6"><CardHeader><CardTitle>Evolução diária</CardTitle></CardHeader><CardContent><TrendChart data={series} /></CardContent></Card>
      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>Comparação entre campanhas</CardTitle></CardHeader>
        <Table>
          <thead>
            <tr>
              <Th>Campanha</Th><Th className="text-right">Visitantes</Th><Th className="text-right">Início</Th><Th className="text-right">Conclusão</Th>
              <Th className="text-right">Leads</Th><Th className="text-right">Cliques</Th><Th className="text-right">Vendas</Th><Th className="text-right">Receita</Th>
              <Th className="text-right">Investimento</Th><Th className="text-right">CPA</Th><Th className="text-right">ROAS</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const m = deriveMetrics(r);
              return (
                <tr key={r.campaignId}>
                  <Td><Link href={`/campaigns/${r.campaignId}/analytics?${new URLSearchParams(sp as Record<string, string>).toString()}`} className="font-medium hover:underline">{r.name}</Link></Td>
                  <Td className="text-right tabular-nums">{formatNumber(r.visitors)}</Td>
                  <Td className="text-right tabular-nums">{formatPercent(m.startRate)}</Td>
                  <Td className="text-right tabular-nums">{formatPercent(m.completionRate)}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(r.leads)}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(r.checkoutClicks)}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(r.purchases)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(r.revenueCents)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(r.adSpendCents)}</Td>
                  <Td className="text-right tabular-nums">{formatMoney(m.cpaCents)}</Td>
                  <Td className="text-right tabular-nums">{m.roas != null ? `${m.roas.toFixed(2)}x` : "—"}</Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>Conversão por origem de tráfego</CardTitle></CardHeader>
        <SegmentTable rows={sources} label="Origem" />
      </Card>
      <Card className="mt-6 overflow-hidden">
        <CardHeader><CardTitle>Vendas recentes</CardTitle></CardHeader>
        {purchases.length ? (
          <Table>
            <thead><tr><Th>Data</Th><Th>Campanha</Th><Th>Origem</Th><Th>Transação</Th><Th>Status</Th><Th className="text-right">Valor</Th></tr></thead>
            <tbody>
              {purchases.map(({ purchase: p, campaignName }) => (
                <tr key={p.id}>
                  <Td className="whitespace-nowrap">{formatDate(p.confirmedAt)}</Td>
                  <Td>{campaignName ?? "—"}</Td>
                  <Td>{p.provider}{!p.sessionId && <Badge className="ml-1.5" tone="warning">sem sessão</Badge>}</Td>
                  <Td className="font-mono text-xs">{p.externalId}</Td>
                  <Td><Badge tone={p.status === "confirmed" ? "success" : "danger"}>{p.status === "confirmed" ? "Confirmada" : p.status === "refunded" ? "Reembolsada" : "Chargeback"}</Badge></Td>
                  <Td className="text-right tabular-nums">{formatMoney(p.amountCents, p.currency)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <CardContent><p className="text-[13px] text-muted-foreground">Nenhuma venda confirmada. Configure um webhook em Integrações.</p></CardContent>
        )}
      </Card>
    </>
  );
}

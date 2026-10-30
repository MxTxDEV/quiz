import Link from "next/link";
import { BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Notice, PageHeader, Table, Td, Th } from "@/components/ui/misc";
import { StatusBadge } from "@/components/ui/badge";
import { PeriodPicker } from "@/components/analytics/period-picker";
import { KpiGrid } from "@/components/analytics/kpis";
import { CompareChart, TrendChart } from "@/components/analytics/charts";
import { businessDate, campaignComparison, dailySeries, funnelCounts, parseRange } from "@/lib/analytics/queries";
import { deriveMetrics } from "@/lib/analytics/metrics";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

export const metadata = { title: "Visão geral" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const range = parseRange(sp);
  const [counts, series, rows] = await Promise.all([funnelCounts(range), dailySeries(range), campaignComparison(range)]);
  const metrics = deriveMetrics(counts);
  const fromStr = businessDate(range.from);
  const toStr = businessDate(new Date(range.to.getTime() - 1));
  const active = rows.filter((r) => r.visitors > 0);

  return (
    <>
      <PageHeader
        title="Visão geral"
        description="Indicadores calculados a partir dos eventos registrados nas campanhas."
        actions={
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus /> Nova campanha
            </Link>
          </Button>
        }
      />
      {sp.erro === "permissao" && <Notice tone="warning" className="mb-4">Você não tem permissão para acessar aquela área.</Notice>}
      <div className="mb-4">
        <PeriodPicker current={range.key} from={fromStr} to={toStr} />
      </div>
      <KpiGrid counts={counts} metrics={metrics} />

      {counts.visitors === 0 && rows.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={BarChart3}
          title="Ainda não há dados"
          description="Crie e publique uma campanha. Os indicadores aparecem assim que os primeiros visitantes chegarem."
          action={
            <Button asChild variant="outline">
              <Link href="/campaigns/new">Criar campanha</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card className="mt-6">
            <CardHeader>
              <div>
                <CardTitle>Evolução diária</CardTitle>
                <CardDescription>Visitantes únicos, quizzes concluídos e vendas confirmadas</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <TrendChart data={series} />
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Comparação entre campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                {active.length ? (
                  <CompareChart data={active.slice(0, 8).map((r) => ({ name: r.name, visitors: r.visitors, completed: r.completed, purchases: r.purchases }))} />
                ) : (
                  <p className="text-[13px] text-muted-foreground py-8 text-center">Sem visitas no período.</p>
                )}
              </CardContent>
            </Card>
            <Card className="xl:col-span-3 overflow-hidden">
              <CardHeader>
                <CardTitle>Campanhas no período</CardTitle>
              </CardHeader>
              <Table>
                <thead>
                  <tr>
                    <Th>Campanha</Th>
                    <Th className="text-right">Visitantes</Th>
                    <Th className="text-right">Conclusão</Th>
                    <Th className="text-right">Vendas</Th>
                    <Th className="text-right">Receita</Th>
                    <Th className="text-right">Conv.</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const m = deriveMetrics(r);
                    return (
                      <tr key={r.campaignId} className="hover:bg-muted/40">
                        <Td>
                          <Link href={`/campaigns/${r.campaignId}/analytics`} className="font-medium hover:underline">
                            {r.name}
                          </Link>
                          <div className="mt-0.5">
                            <StatusBadge status={r.status as "draft"} />
                          </div>
                        </Td>
                        <Td className="text-right tabular-nums">{formatNumber(r.visitors)}</Td>
                        <Td className="text-right tabular-nums">{formatPercent(m.completionRate)}</Td>
                        <Td className="text-right tabular-nums">{formatNumber(r.purchases)}</Td>
                        <Td className="text-right tabular-nums">{formatMoney(r.revenueCents)}</Td>
                        <Td className="text-right tabular-nums">{formatPercent(m.purchaseRate, 2)}</Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Card>
          </div>
        </>
      )}
    </>
  );
}

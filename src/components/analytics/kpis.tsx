import type { DerivedMetrics, FunnelCounts } from "@/lib/analytics/metrics";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border bg-card px-4 py-3.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function KpiGrid({ counts, metrics }: { counts: FunnelCounts; metrics: DerivedMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      <Kpi label="Visitantes únicos" value={formatNumber(counts.visitors)} />
      <Kpi label="Quizzes iniciados" value={formatNumber(counts.started)} hint={`Taxa de início ${formatPercent(metrics.startRate)}`} />
      <Kpi label="Quizzes concluídos" value={formatNumber(counts.completed)} hint={`Conclusão ${formatPercent(metrics.completionRate)}`} />
      <Kpi label="Leads capturados" value={formatNumber(counts.leads)} />
      <Kpi label="Vendas confirmadas" value={formatNumber(counts.purchases)} hint={`${formatNumber(counts.checkoutClicks)} cliques no checkout`} />
      <Kpi label="Faturamento bruto" value={formatMoney(counts.revenueCents)} hint="Somente vendas confirmadas" />
      <Kpi label="Investimento em anúncios" value={formatMoney(counts.adSpendCents)} hint="Lançado manualmente" />
      <Kpi label="Custo por aquisição" value={formatMoney(metrics.cpaCents)} hint={metrics.roas != null ? `ROAS ${metrics.roas.toFixed(2)}x` : "ROAS —"} />
      <Kpi label="Taxa de conversão" value={formatPercent(metrics.purchaseRate, 2)} hint="Vendas / visitantes únicos" />
      <Kpi label="Receita por visitante" value={formatMoney(metrics.revenuePerVisitorCents)} />
    </div>
  );
}

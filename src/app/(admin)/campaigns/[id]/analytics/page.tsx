import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/misc";
import { PeriodPicker } from "@/components/analytics/period-picker";
import { KpiGrid } from "@/components/analytics/kpis";
import { FunnelBars, TrendChart } from "@/components/analytics/charts";
import { SegmentTable } from "@/components/analytics/segment-table";
import { AdSpendPanel, ManualPurchaseForm } from "@/components/admin/ad-spend-panel";
import { loadCampaign } from "@/lib/server/campaign";
import { hasRole, requireUser } from "@/lib/auth/session";
import {
  answersByQuestion,
  businessDate,
  byProfile,
  bySessionDimension,
  dailySeries,
  funnelCounts,
  parseRange,
} from "@/lib/analytics/queries";
import { deriveMetrics, questionDropoff } from "@/lib/analytics/metrics";
import { listAdSpend } from "@/lib/services/integrations";
import { formatNumber, formatPercent } from "@/lib/utils";
import { parseConfig } from "@/lib/domain/config";

export const metadata = { title: "Analytics da campanha" };

const deviceLabels: Record<string, string> = { mobile: "Celular", tablet: "Tablet", desktop: "Computador" };

export default async function CampaignAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [user, c] = await Promise.all([requireUser(), loadCampaign(id)]);
  const range = parseRange(sp);
  const [counts, series, answered, profiles, sources, devices, utmCampaigns, utmContents, spend] = await Promise.all([
    funnelCounts(range, c.id),
    dailySeries(range, c.id),
    answersByQuestion(range, c.id),
    byProfile(range, c.id),
    bySessionDimension(range, c.id, "traffic_source"),
    bySessionDimension(range, c.id, "device"),
    bySessionDimension(range, c.id, "utm_campaign"),
    bySessionDimension(range, c.id, "utm_content"),
    listAdSpend(c.id),
  ]);
  const metrics = deriveMetrics(counts);
  // abandono calculado sobre as perguntas da versão publicada (a que os visitantes responderam)
  const live = c.publishedConfig ? parseConfig(c.publishedConfig) : c.config;
  const questions = live.quiz.questions;
  const dropoff = questionDropoff(questions.map((q) => ({ id: q.id, title: q.title })), answered, counts.started);
  const profileName = (pid: string) => [...c.config.profiles, ...live.profiles].find((p) => p.id === pid)?.name ?? (pid === "—" ? "Sem perfil" : `${pid} (removido)`);

  return (
    <div className="space-y-6">
      <PeriodPicker current={range.key} from={businessDate(range.from)} to={businessDate(new Date(range.to.getTime() - 1))} />
      <KpiGrid counts={counts} metrics={metrics} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><div><CardTitle>Funil de conversão</CardTitle><CardDescription>Sessões únicas em cada etapa (percentual sobre a etapa anterior)</CardDescription></div></CardHeader>
          <CardContent>
            <FunnelBars
              steps={[
                { label: "Visitantes", value: counts.visitors },
                { label: "Iniciaram o quiz", value: counts.started },
                { label: "Concluíram", value: counts.completed },
                { label: "Viram o resultado", value: counts.resultViews },
                { label: "Viram a oferta", value: counts.offerViews },
                { label: "Clicaram no checkout", value: counts.checkoutClicks },
                { label: "Compraram", value: counts.purchases },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Evolução diária</CardTitle></CardHeader>
          <CardContent><TrendChart data={series} /></CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader><div><CardTitle>Abandono por pergunta</CardTitle><CardDescription>Quem chegou à pergunta e não avançou (pular uma pergunta opcional conta como avançar)</CardDescription></div></CardHeader>
        {dropoff.length ? (
          <Table>
            <thead><tr><Th className="w-10">#</Th><Th>Pergunta</Th><Th className="text-right">Chegaram</Th><Th className="text-right">Avançaram</Th><Th className="text-right">Abandono</Th></tr></thead>
            <tbody>
              {dropoff.map((d, i) => (
                <tr key={d.questionId}>
                  <Td className="text-muted-foreground tabular-nums">{i + 1}</Td>
                  <Td>{d.title}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(d.reached)}</Td>
                  <Td className="text-right tabular-nums">{formatNumber(d.answered)}</Td>
                  <Td className="text-right tabular-nums">
                    <span className={d.dropoff != null && d.dropoff > 0.25 ? "text-danger font-medium" : ""}>{formatPercent(d.dropoff)}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <CardContent><p className="text-[13px] text-muted-foreground">O quiz não tem perguntas.</p></CardContent>
        )}
      </Card>

      <Card className="overflow-hidden">
        <CardHeader><div><CardTitle>Conversão por perfil</CardTitle><CardDescription>Base: sessões que concluíram o quiz com cada perfil</CardDescription></div></CardHeader>
        <SegmentTable rows={profiles} label="Perfil" base="completed" labelFor={profileName} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Por origem de tráfego</CardTitle></CardHeader>
          <SegmentTable rows={sources} label="Origem" />
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Por dispositivo</CardTitle></CardHeader>
          <SegmentTable rows={devices} label="Dispositivo" labelFor={(k) => deviceLabels[k] ?? k} />
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Por UTM campaign</CardTitle></CardHeader>
          <SegmentTable rows={utmCampaigns} label="utm_campaign" />
        </Card>
        <Card className="overflow-hidden">
          <CardHeader><CardTitle>Por UTM content (criativo)</CardTitle></CardHeader>
          <SegmentTable rows={utmContents} label="utm_content" />
        </Card>
      </div>

      <Card>
        <CardHeader><div><CardTitle>Investimento em anúncios</CardTitle><CardDescription>Lançamentos manuais usados no cálculo de CPA e ROAS</CardDescription></div></CardHeader>
        <CardContent>
          <AdSpendPanel campaignId={c.id} canEdit={hasRole(user, "editor")} today={businessDate()} rows={spend.map((s) => ({ id: s.id, date: s.date, amountCents: s.amountCents, source: s.source, note: s.note }))} />
        </CardContent>
      </Card>

      {hasRole(user, "owner") && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Registrar venda manualmente</CardTitle>
              <CardDescription>Prefira webhooks (Integrações). Use apenas para vendas conferidas na plataforma de pagamento.</CardDescription>
            </div>
          </CardHeader>
          <CardContent><ManualPurchaseForm campaignId={c.id} /></CardContent>
        </Card>
      )}
    </div>
  );
}

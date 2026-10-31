import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import type { FunnelCounts } from "./metrics";

export const TZ = "America/Sao_Paulo";

export type Range = { from: Date; to: Date }; // [from, to)

export type PeriodKey = "7d" | "30d" | "90d" | "today" | "custom";

/** Data (YYYY-MM-DD) no fuso de negócio. Brasília não tem horário de verão desde 2019 (UTC-3). */
export function businessDate(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
const startOfBusinessDay = (ymd: string) => new Date(`${ymd}T00:00:00-03:00`);

/** Converte ?period=30d | ?period=custom&from=YYYY-MM-DD&to=YYYY-MM-DD em um intervalo [from, to). */
export function parseRange(params: { period?: string; from?: string; to?: string }): Range & { key: PeriodKey } {
  const day = 86400_000;
  const tomorrow = new Date(startOfBusinessDay(businessDate()).getTime() + day);
  const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
  if (params.period === "custom" && isDate(params.from) && isDate(params.to)) {
    const from = startOfBusinessDay(params.from!);
    const to = new Date(startOfBusinessDay(params.to!).getTime() + day);
    if (from < to) return { from, to, key: "custom" };
  }
  if (params.period === "today") return { from: new Date(tomorrow.getTime() - day), to: tomorrow, key: "today" };
  const key: PeriodKey = params.period === "7d" || params.period === "90d" ? params.period : "30d";
  const days = key === "7d" ? 7 : key === "90d" ? 90 : 30;
  return { from: new Date(tomorrow.getTime() - days * day), to: tomorrow, key };
}

const campaignFilter = (col: SQL, campaignId?: string | null) =>
  campaignId ? sql`and ${col} = ${campaignId}::uuid` : sql``;

type Row = Record<string, unknown>;
const num = (v: unknown) => (v == null ? 0 : Number(v));

export async function funnelCounts(range: Range, campaignId?: string | null): Promise<FunnelCounts> {
  const [e] = (await db.execute(sql`
    select
      count(distinct visitor_id) filter (where type = 'page_view') as visitors,
      count(distinct session_id) filter (where type = 'quiz_started') as started,
      count(distinct session_id) filter (where type = 'quiz_completed') as completed,
      count(distinct session_id) filter (where type = 'result_viewed') as result_views,
      count(distinct session_id) filter (where type = 'offer_viewed') as offer_views,
      count(distinct session_id) filter (where type = 'sales_page_view') as sales_page_views,
      count(distinct session_id) filter (where type = 'purchase_button_click') as purchase_clicks,
      count(distinct session_id) filter (where type in ('checkout_redirect', 'checkout_clicked')) as checkout_clicks
    from events
    where created_at >= ${range.from.toISOString()} and created_at < ${range.to.toISOString()}
    ${campaignFilter(sql`campaign_id`, campaignId)}
  `)) as Row[];
  const [p] = (await db.execute(sql`
    select count(*) as purchases, coalesce(sum(amount_cents), 0) as revenue
    from purchases
    where status = 'confirmed' and confirmed_at >= ${range.from.toISOString()} and confirmed_at < ${range.to.toISOString()}
    ${campaignFilter(sql`campaign_id`, campaignId)}
  `)) as Row[];
  const [l] = (await db.execute(sql`
    select count(*) as leads from leads
    where created_at >= ${range.from.toISOString()} and created_at < ${range.to.toISOString()}
    ${campaignFilter(sql`campaign_id`, campaignId)}
  `)) as Row[];
  const [a] = (await db.execute(sql`
    select coalesce(sum(amount_cents), 0) as spend from ad_spend
    where date >= (${range.from.toISOString()}::timestamptz at time zone ${TZ})::date
      and date < (${range.to.toISOString()}::timestamptz at time zone ${TZ})::date
    ${campaignFilter(sql`campaign_id`, campaignId)}
  `)) as Row[];
  return {
    visitors: num(e.visitors),
    started: num(e.started),
    completed: num(e.completed),
    resultViews: num(e.result_views),
    salesPageViews: num(e.sales_page_views),
    offerViews: num(e.offer_views),
    purchaseClicks: num(e.purchase_clicks),
    checkoutClicks: num(e.checkout_clicks),
    leads: num(l.leads),
    purchases: num(p.purchases),
    revenueCents: num(p.revenue),
    adSpendCents: num(a.spend),
  };
}

export type DailyPoint = { day: string; visitors: number; completed: number; purchases: number; revenueCents: number };

export async function dailySeries(range: Range, campaignId?: string | null): Promise<DailyPoint[]> {
  const rows = (await db.execute(sql`
    with days as (
      select generate_series(
        (${range.from.toISOString()}::timestamptz at time zone ${TZ})::date,
        ((${range.to.toISOString()}::timestamptz - interval '1 second') at time zone ${TZ})::date,
        interval '1 day'
      )::date as day
    ),
    ev as (
      select (created_at at time zone ${TZ})::date as day,
        count(distinct visitor_id) filter (where type = 'page_view') as visitors,
        count(distinct session_id) filter (where type = 'quiz_completed') as completed
      from events
      where created_at >= ${range.from.toISOString()} and created_at < ${range.to.toISOString()}
      ${campaignFilter(sql`campaign_id`, campaignId)}
      group by 1
    ),
    pu as (
      select (confirmed_at at time zone ${TZ})::date as day, count(*) as purchases, sum(amount_cents) as revenue
      from purchases
      where status = 'confirmed' and confirmed_at >= ${range.from.toISOString()} and confirmed_at < ${range.to.toISOString()}
      ${campaignFilter(sql`campaign_id`, campaignId)}
      group by 1
    )
    select to_char(days.day, 'YYYY-MM-DD') as day,
      coalesce(ev.visitors, 0) as visitors, coalesce(ev.completed, 0) as completed,
      coalesce(pu.purchases, 0) as purchases, coalesce(pu.revenue, 0) as revenue
    from days left join ev on ev.day = days.day left join pu on pu.day = days.day
    order by days.day
  `)) as Row[];
  return rows.map((r) => ({
    day: String(r.day),
    visitors: num(r.visitors),
    completed: num(r.completed),
    purchases: num(r.purchases),
    revenueCents: num(r.revenue),
  }));
}

export type CampaignRow = FunnelCounts & { campaignId: string; name: string; slug: string; status: string };

export async function campaignComparison(range: Range): Promise<CampaignRow[]> {
  const rows = (await db.execute(sql`
    select c.id, c.name, c.slug, c.status,
      coalesce(e.visitors, 0) as visitors, coalesce(e.started, 0) as started, coalesce(e.completed, 0) as completed,
      coalesce(e.result_views, 0) as result_views, coalesce(e.offer_views, 0) as offer_views,
      coalesce(e.checkout_clicks, 0) as checkout_clicks,
      coalesce(e.sales_page_views, 0) as sales_page_views, coalesce(e.purchase_clicks, 0) as purchase_clicks,
      coalesce(l.leads, 0) as leads, coalesce(p.purchases, 0) as purchases, coalesce(p.revenue, 0) as revenue,
      coalesce(a.spend, 0) as spend
    from campaigns c
    left join (
      select campaign_id,
        count(distinct visitor_id) filter (where type = 'page_view') as visitors,
        count(distinct session_id) filter (where type = 'quiz_started') as started,
        count(distinct session_id) filter (where type = 'quiz_completed') as completed,
        count(distinct session_id) filter (where type = 'result_viewed') as result_views,
        count(distinct session_id) filter (where type = 'offer_viewed') as offer_views,
        count(distinct session_id) filter (where type = 'sales_page_view') as sales_page_views,
      count(distinct session_id) filter (where type = 'purchase_button_click') as purchase_clicks,
      count(distinct session_id) filter (where type in ('checkout_redirect', 'checkout_clicked')) as checkout_clicks
      from events where created_at >= ${range.from.toISOString()} and created_at < ${range.to.toISOString()}
      group by campaign_id
    ) e on e.campaign_id = c.id
    left join (
      select campaign_id, count(*) as leads from leads
      where created_at >= ${range.from.toISOString()} and created_at < ${range.to.toISOString()} group by campaign_id
    ) l on l.campaign_id = c.id
    left join (
      select campaign_id, count(*) as purchases, sum(amount_cents) as revenue from purchases
      where status = 'confirmed' and confirmed_at >= ${range.from.toISOString()} and confirmed_at < ${range.to.toISOString()} group by campaign_id
    ) p on p.campaign_id = c.id
    left join (
      select campaign_id, sum(amount_cents) as spend from ad_spend
      where date >= (${range.from.toISOString()}::timestamptz at time zone ${TZ})::date
        and date < (${range.to.toISOString()}::timestamptz at time zone ${TZ})::date
      group by campaign_id
    ) a on a.campaign_id = c.id
    where c.status <> 'archived' or coalesce(e.visitors, 0) > 0
    order by coalesce(e.visitors, 0) desc, c.updated_at desc
  `)) as Row[];
  return rows.map((r) => ({
    campaignId: String(r.id),
    name: String(r.name),
    slug: String(r.slug),
    status: String(r.status),
    visitors: num(r.visitors),
    started: num(r.started),
    completed: num(r.completed),
    resultViews: num(r.result_views),
    salesPageViews: num(r.sales_page_views),
    offerViews: num(r.offer_views),
    purchaseClicks: num(r.purchase_clicks),
    checkoutClicks: num(r.checkout_clicks),
    leads: num(r.leads),
    purchases: num(r.purchases),
    revenueCents: num(r.revenue),
    adSpendCents: num(r.spend),
  }));
}

/** Sessões distintas que responderam (sem pular) cada pergunta. */
export async function answersByQuestion(range: Range, campaignId: string): Promise<Record<string, number>> {
  const rows = (await db.execute(sql`
    select question_id, count(distinct session_id) as n from events
    where type = 'question_answered' and campaign_id = ${campaignId}::uuid
      and created_at >= ${range.from.toISOString()} and created_at < ${range.to.toISOString()}
    group by question_id
  `)) as Row[];
  return Object.fromEntries(rows.map((r) => [String(r.question_id), num(r.n)]));
}

export type SegmentRow = {
  key: string;
  visitors: number;
  completed: number;
  checkoutClicks: number;
  purchases: number;
  revenueCents: number;
};

/** Conversão por perfil de resultado (base: sessões que concluíram com aquele perfil). */
export async function byProfile(range: Range, campaignId: string): Promise<SegmentRow[]> {
  const rows = (await db.execute(sql`
    select s.profile_id as key,
      count(*) as completed,
      count(*) filter (where exists (select 1 from events e where e.session_id = s.id and e.type in ('checkout_redirect', 'checkout_clicked'))) as clicks,
      coalesce(sum(p.n), 0) as purchases, coalesce(sum(p.revenue), 0) as revenue
    from visitor_sessions s
    left join (
      select session_id, count(*) as n, sum(amount_cents) as revenue from purchases where status = 'confirmed' group by session_id
    ) p on p.session_id = s.id
    where s.campaign_id = ${campaignId}::uuid and s.completed_at >= ${range.from.toISOString()} and s.completed_at < ${range.to.toISOString()}
    group by s.profile_id
    order by completed desc
  `)) as Row[];
  return rows.map((r) => ({
    key: String(r.key ?? "—"),
    visitors: num(r.completed),
    completed: num(r.completed),
    checkoutClicks: num(r.clicks),
    purchases: num(r.purchases),
    revenueCents: num(r.revenue),
  }));
}

/** Conversão por origem de tráfego ou outra dimensão da sessão. */
export async function bySessionDimension(
  range: Range,
  campaignId: string | null,
  dimension: "traffic_source" | "device" | "utm_campaign" | "utm_content",
): Promise<SegmentRow[]> {
  const col = sql.raw(`s.${dimension}`); // whitelist acima
  const rows = (await db.execute(sql`
    select coalesce(${col}, '(não definido)') as key,
      count(distinct s.visitor_id) as visitors,
      count(*) filter (where s.completed_at is not null) as completed,
      count(*) filter (where exists (select 1 from events e where e.session_id = s.id and e.type in ('checkout_redirect', 'checkout_clicked'))) as clicks,
      coalesce(sum(p.n), 0) as purchases, coalesce(sum(p.revenue), 0) as revenue
    from visitor_sessions s
    left join (
      select session_id, count(*) as n, sum(amount_cents) as revenue from purchases where status = 'confirmed' group by session_id
    ) p on p.session_id = s.id
    where s.created_at >= ${range.from.toISOString()} and s.created_at < ${range.to.toISOString()}
    ${campaignFilter(sql`s.campaign_id`, campaignId)}
    group by 1
    order by visitors desc
    limit 50
  `)) as Row[];
  return rows.map((r) => ({
    key: String(r.key),
    visitors: num(r.visitors),
    completed: num(r.completed),
    checkoutClicks: num(r.clicks),
    purchases: num(r.purchases),
    revenueCents: num(r.revenue),
  }));
}

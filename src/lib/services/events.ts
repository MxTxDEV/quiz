import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events, type EventType, type VisitorSession } from "@/lib/db/schema";

type SessionLike = { id: string | null } & Pick<
  VisitorSession,
  "campaignId" | "visitorId" | "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm" | "trafficSource" | "device"
>;

export type EventExtras = {
  questionId?: string | null;
  profileId?: string | null;
  valueCents?: number | null;
  metadata?: Record<string, unknown>;
};

/** Registra um evento herdando origem/UTM/dispositivo da sessão do visitante. */
export async function recordEvent(session: SessionLike, type: EventType, extras: EventExtras = {}) {
  await db.insert(events).values({
    campaignId: session.campaignId,
    sessionId: session.id,
    visitorId: session.visitorId,
    type,
    questionId: extras.questionId ?? null,
    profileId: extras.profileId ?? null,
    valueCents: extras.valueCents ?? null,
    utmSource: session.utmSource,
    utmMedium: session.utmMedium,
    utmCampaign: session.utmCampaign,
    utmContent: session.utmContent,
    utmTerm: session.utmTerm,
    trafficSource: session.trafficSource,
    device: session.device,
    metadata: extras.metadata ?? {},
  });
}

/** Registra o evento apenas uma vez por sessão (ex.: result_viewed, offer_viewed). */
export async function recordEventOnce(session: SessionLike & { id: string }, type: EventType, extras: EventExtras = {}) {
  const [existing] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.sessionId, session.id), eq(events.type, type)))
    .limit(1);
  if (existing) return false;
  await recordEvent(session, type, extras);
  return true;
}

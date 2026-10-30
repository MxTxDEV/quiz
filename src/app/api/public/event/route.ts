import { publicHandler, str } from "@/lib/http/public-api";
import { markOfferViewed, markResultViewed, markStarted, PublicFlowError } from "@/lib/services/public-flow";

/** Eventos de navegação que o cliente pode reportar. Os demais são registrados pelo servidor. */
const handlers = {
  quiz_started: markStarted,
  result_viewed: markResultViewed,
  offer_viewed: markOfferViewed,
} as const;

export const POST = publicHandler("event", { max: 120, windowMs: 60_000 }, async (body) => {
  const type = str(body.type) as keyof typeof handlers;
  const handler = handlers[type];
  if (!handler) throw new PublicFlowError("Evento não permitido", 400);
  await handler(str(body.sessionId));
  return { ok: true };
});

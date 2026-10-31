import { publicHandler, str } from "@/lib/http/public-api";
import {
  markOfferViewed,
  markPersonalizedViewed,
  markResultViewed,
  markSalesPageViewed,
  markStarted,
  PublicFlowError,
  recordPurchaseButtonClick,
} from "@/lib/services/public-flow";

/** Eventos de navegação que o cliente pode reportar. Os demais são registrados pelo servidor. */
const handlers = {
  quiz_started: markStarted,
  result_viewed: markResultViewed,
  offer_viewed: markOfferViewed,
  sales_page_view: markSalesPageViewed,
  personalized_content_view: markPersonalizedViewed,
  purchase_button_click: (sid: string, blockId?: string | null) => recordPurchaseButtonClick(sid, blockId),
} as const;

export const POST = publicHandler("event", { max: 120, windowMs: 60_000 }, async (body) => {
  const type = str(body.type) as keyof typeof handlers;
  const handler = handlers[type];
  if (!handler) throw new PublicFlowError("Evento não permitido", 400);
  await handler(str(body.sessionId), str(body.blockId) || null);
  return { ok: true };
});

import { publicHandler } from "@/lib/http/public-api";
import { startVisit } from "@/lib/services/public-flow";

export const POST = publicHandler("session", { max: 30, windowMs: 60_000 }, async (body, req) =>
  startVisit(
    {
      campaignId: body.campaignId as string,
      visitorId: typeof body.visitorId === "string" ? body.visitorId : undefined,
      params: (body.params as Record<string, string>) ?? {},
      referrer: typeof body.referrer === "string" ? body.referrer : null,
    },
    req.headers.get("user-agent"),
  ),
);

import { publicHandler, str } from "@/lib/http/public-api";
import { captureLead } from "@/lib/services/public-flow";

export const POST = publicHandler("lead", { max: 10, windowMs: 60_000 }, async (body, _req, ip) =>
  captureLead(str(body.sessionId), { name: body.name, email: body.email, consent: body.consent }, ip),
);

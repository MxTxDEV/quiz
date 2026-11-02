import { publicHandler, str } from "@/lib/http/public-api";
import { submitReview } from "@/lib/services/reviews";

export const POST = publicHandler("review", { max: 5, windowMs: 10 * 60_000 }, async (body, _req, ip) =>
  submitReview(
    str(body.slug),
    { name: str(body.name), city: str(body.city), rating: Number(body.rating), text: str(body.text), email: str(body.email), consent: body.consent === true, website: str(body.website) } as never,
    ip,
  ),
);

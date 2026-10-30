import { publicHandler, str } from "@/lib/http/public-api";
import { submitAnswer } from "@/lib/services/public-flow";

export const POST = publicHandler("answer", { max: 240, windowMs: 60_000 }, async (body) =>
  submitAnswer(str(body.sessionId), str(body.questionId).slice(0, 64), body.value),
);

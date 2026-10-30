import { publicHandler, str } from "@/lib/http/public-api";
import { completeQuiz } from "@/lib/services/public-flow";

export const POST = publicHandler("complete", { max: 30, windowMs: 60_000 }, async (body) => completeQuiz(str(body.sessionId)));

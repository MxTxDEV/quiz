"use client";

import { useEffect, useMemo } from "react";
import type { PublicCampaign } from "@/lib/domain/public";
import { QuizRunner, type AnswerInput, type Completion, type LeadInput, type QuizDriver } from "./quiz-runner";

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Erro de conexão. Tente novamente.");
  return data as T;
}

function visitorId(): string {
  try {
    const key = "fos_vid";
    let id = localStorage.getItem(key);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2).padEnd(12, "0");
  }
}

/** Driver real: cria a sessão (page_view) e serializa as chamadas para preservar a ordem. */
function createLiveDriver(campaignId: string): QuizDriver & { init(): void } {
  let session: Promise<string> | null = null;
  const init = () => {
    if (session) return session;
    const params: Record<string, string> = {};
    new URLSearchParams(location.search).forEach((v, k) => {
      if (/^(utm_|fbclid$|gclid$|ttclid$)/.test(k)) params[k] = v.slice(0, 500);
    });
    session = post<{ sessionId: string }>("/api/public/session", {
      campaignId,
      visitorId: visitorId(),
      params,
      referrer: document.referrer || null,
    }).then((r) => r.sessionId);
    return session;
  };

  let chain: Promise<unknown> = Promise.resolve();
  const enqueue = <T,>(fn: (sid: string) => Promise<T>): Promise<T> => {
    const p = chain.then(() => init()).then(fn);
    chain = p.catch(() => undefined);
    return p;
  };

  return {
    init: () => void init().catch(() => undefined),
    start: () => enqueue((sid) => post("/api/public/event", { sessionId: sid, type: "quiz_started" })).then(() => undefined),
    answer: (questionId: string, value: AnswerInput) =>
      enqueue((sid) => post("/api/public/answer", { sessionId: sid, questionId, value })).then(() => undefined),
    complete: () => enqueue((sid) => post<Completion>("/api/public/complete", { sessionId: sid })),
    resultViewed: () => enqueue((sid) => post("/api/public/event", { sessionId: sid, type: "result_viewed" })).then(() => undefined),
    lead: (data: LeadInput) => enqueue((sid) => post("/api/public/lead", { sessionId: sid, ...data })).then(() => undefined),
  };
}

export function LiveQuiz({ campaign }: { campaign: PublicCampaign }) {
  const driver = useMemo(() => createLiveDriver(campaign.id), [campaign.id]);
  useEffect(() => driver.init(), [driver]);
  return <QuizRunner campaign={campaign} driver={driver} />;
}

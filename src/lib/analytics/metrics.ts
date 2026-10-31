/** Cálculos puros de métricas. Divisão por zero → null (exibido como "—"). */

export const ratio = (num: number, den: number): number | null => (den > 0 ? num / den : null);

export type FunnelCounts = {
  visitors: number; // visitantes únicos (page_view)
  started: number;
  completed: number;
  leads: number;
  resultViews: number;
  salesPageViews: number;
  offerViews: number;
  purchaseClicks: number; // cliques em botões de compra (intenção)
  checkoutClicks: number; // redirecionamentos efetivos ao checkout
  purchases: number; // somente confirmadas
  revenueCents: number; // somente confirmadas
  adSpendCents: number;
};

export type DerivedMetrics = {
  startRate: number | null;
  completionRate: number | null;
  purchaseRate: number | null;
  checkoutClickRate: number | null;
  cpaCents: number | null;
  roas: number | null;
  revenuePerVisitorCents: number | null;
};

export function deriveMetrics(c: FunnelCounts): DerivedMetrics {
  return {
    startRate: ratio(c.started, c.visitors),
    completionRate: ratio(c.completed, c.started),
    purchaseRate: ratio(c.purchases, c.visitors),
    checkoutClickRate: ratio(c.checkoutClicks, c.visitors),
    cpaCents: c.adSpendCents > 0 && c.purchases > 0 ? Math.round(c.adSpendCents / c.purchases) : null,
    roas: ratio(c.revenueCents, c.adSpendCents),
    revenuePerVisitorCents: c.visitors > 0 ? Math.round(c.revenueCents / c.visitors) : null,
  };
}

export type QuestionDropoff = {
  questionId: string;
  title: string;
  reached: number;
  answered: number;
  dropoff: number | null; // (reached - answered) / reached
};

/**
 * Abandono por pergunta: quem "chegou" à pergunta n é quem respondeu a n-1
 * (para a primeira, quem iniciou o quiz).
 */
export function questionDropoff(
  questions: { id: string; title: string }[],
  answeredByQuestion: Record<string, number>,
  started: number,
): QuestionDropoff[] {
  let reached = started;
  return questions.map((q) => {
    const answered = answeredByQuestion[q.id] ?? 0;
    const row = { questionId: q.id, title: q.title, reached, answered, dropoff: ratio(Math.max(reached - answered, 0), reached) };
    reached = answered;
    return row;
  });
}

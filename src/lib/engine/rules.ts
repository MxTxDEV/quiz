import type { CampaignConfig, Condition, ConditionGroup, Profile } from "@/lib/domain/config";
import { deriveAttributes, type Answers, type Attributes } from "./answers";

export type EvaluationContext = { answers: Answers; attributes: Attributes; score: number };

function isBlank(v: unknown): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

function norm(v: unknown): string {
  return String(v).trim().toLowerCase();
}

function toNumber(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function equalsScalar(actual: unknown, expected: string): boolean {
  const a = toNumber(actual);
  const b = toNumber(expected);
  if (a !== null && b !== null) return a === b;
  return norm(actual) === norm(expected);
}

function resolveValue(cond: Condition, ctx: EvaluationContext): unknown {
  switch (cond.source) {
    case "answer":
      return ctx.answers[cond.target];
    case "attribute":
      return ctx.attributes[cond.target];
    case "score":
      return ctx.score;
  }
}

export function evaluateCondition(cond: Condition, ctx: EvaluationContext): boolean {
  const actual = resolveValue(cond, ctx);
  const expected = cond.value;

  switch (cond.operator) {
    case "answered":
      return !isBlank(actual);
    case "not_answered":
      return isBlank(actual);
  }
  if (isBlank(actual)) return cond.operator === "not_equals" || cond.operator === "not_contains";

  const list = Array.isArray(actual) ? actual : null;
  switch (cond.operator) {
    case "equals":
      return list ? list.some((v) => equalsScalar(v, expected)) : equalsScalar(actual, expected);
    case "not_equals":
      return list ? !list.some((v) => equalsScalar(v, expected)) : !equalsScalar(actual, expected);
    case "contains":
      return list
        ? list.some((v) => equalsScalar(v, expected))
        : norm(actual).includes(norm(expected));
    case "not_contains":
      return list
        ? !list.some((v) => equalsScalar(v, expected))
        : !norm(actual).includes(norm(expected));
    case "gt":
    case "gte":
    case "lt":
    case "lte": {
      const a = toNumber(list ? null : actual);
      const b = toNumber(expected);
      if (a === null || b === null) return false;
      if (cond.operator === "gt") return a > b;
      if (cond.operator === "gte") return a >= b;
      if (cond.operator === "lt") return a < b;
      return a <= b;
    }
  }
  return false;
}

/** Grupo vazio nunca é atendido — evita regras "pega-tudo" acidentais. */
export function evaluateGroup(group: ConditionGroup, ctx: EvaluationContext): boolean {
  if (group.children.length === 0) return false;
  const results = group.children.map((child) =>
    child.kind === "group" ? evaluateGroup(child, ctx) : evaluateCondition(child, ctx),
  );
  return group.combinator === "and" ? results.every(Boolean) : results.some(Boolean);
}

export type Resolution = {
  profile: Profile | null;
  matchedRuleId: string | null;
  attributes: Attributes;
  score: number;
  tags: string[];
  /** justificativas do resultado, tiradas das respostas reais (ver quiz.result.reasons) */
  reasons: string[];
  /** "Sua realidade": resumo das respostas (quiz.result.reality) */
  reality: string[];
  /** modo pontuação: total de cada perfil (para auditoria e testes) */
  points: Record<string, number>;
};

/** Frases de resumo ("Sua realidade"), na ordem configurada. */
export function resultReality(config: CampaignConfig, ctx: EvaluationContext): string[] {
  const r = config.quiz.result;
  return r.reality.filter((x) => x.text.trim() && evaluateGroup(x.when, ctx)).slice(0, r.maxReality).map((x) => x.text);
}

/**
 * Modo pontuação: cada resposta soma pontos a um ou mais perfis (option.points).
 * Vence o maior total. Empate → o primeiro perfil na lista `scoring.tieBreak`
 * (perfis fora da lista vêm depois, na ordem em que foram cadastrados).
 */
export function scoreProfiles(config: CampaignConfig, answers: Answers) {
  const points: Record<string, number> = Object.fromEntries(config.profiles.map((p) => [p.id, 0]));
  for (const q of config.quiz.questions) {
    const a = answers[q.id];
    if (a === undefined || a === null) continue;
    for (const optId of Array.isArray(a) ? a : [String(a)]) {
      const opt = q.options.find((o) => o.id === optId);
      if (!opt) continue;
      for (const [pid, n] of Object.entries(opt.points)) if (pid in points) points[pid] += n;
    }
  }
  const order = [...config.scoring.tieBreak.filter((id) => id in points), ...config.profiles.map((p) => p.id).filter((id) => !config.scoring.tieBreak.includes(id))];
  let best: string | null = null;
  for (const id of order) if (best === null || points[id] > points[best]) best = id;
  return { points, winner: best };
}

/** Frases de "por que combina com você": as primeiras cuja condição bate com as respostas. */
export function resultReasons(config: CampaignConfig, ctx: EvaluationContext): string[] {
  const r = config.quiz.result;
  return r.reasons.filter((x) => x.text.trim() && evaluateGroup(x.when, ctx)).slice(0, r.maxReasons).map((x) => x.text);
}

/**
 * Executa as regras na ordem configurada: a primeira regra atendida define o perfil.
 * Sem correspondência → perfil marcado como padrão (ou o primeiro perfil).
 */
export function resolveProfile(config: CampaignConfig, answers: Answers): Resolution {
  const { attributes, score, tags } = deriveAttributes(config.quiz, answers);
  const ctx: EvaluationContext = { answers, attributes, score };
  const byId = new Map(config.profiles.map((p) => [p.id, p]));
  const extras = () => ({ reasons: resultReasons(config, ctx), reality: resultReality(config, ctx) });

  if (config.scoring.mode === "points") {
    const { points, winner } = scoreProfiles(config, answers);
    const profile = (winner && byId.get(winner)) || config.profiles.find((p) => p.isDefault) || config.profiles[0] || null;
    return { profile, matchedRuleId: null, attributes, score, tags, points, ...extras() };
  }

  for (const rule of config.rules) {
    if (!rule.enabled) continue;
    const profile = byId.get(rule.profileId);
    if (!profile) continue;
    if (evaluateGroup(rule.when, ctx)) return { profile, matchedRuleId: rule.id, attributes, score, tags, points: {}, ...extras() };
  }
  const fallback = config.profiles.find((p) => p.isDefault) ?? config.profiles[0] ?? null;
  return { profile: fallback, matchedRuleId: null, attributes, score, tags, points: {}, ...extras() };
}

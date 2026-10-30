import type { Question, Quiz } from "@/lib/domain/config";

export type AnswerValue = string | string[] | number;
export type Answers = Record<string, AnswerValue>;
export type AttributeValue = string | number | string[];
export type Attributes = Record<string, AttributeValue>;

export type AnswerCheck = { ok: true; value: AnswerValue | null } | { ok: false; error: string };

/**
 * Valida e normaliza a resposta enviada pelo visitante contra a definição da pergunta.
 * `null` significa "pulou" (permitido só em perguntas opcionais).
 */
export function normalizeAnswer(question: Question, raw: unknown): AnswerCheck {
  const empty =
    raw === undefined ||
    raw === null ||
    (typeof raw === "string" && raw.trim() === "") ||
    (Array.isArray(raw) && raw.length === 0);
  if (empty) return question.required ? { ok: false, error: "Resposta obrigatória" } : { ok: true, value: null };

  const optionIds = new Set(question.options.map((o) => o.id));
  switch (question.type) {
    case "single":
    case "yes_no": {
      if (typeof raw !== "string" || !optionIds.has(raw)) return { ok: false, error: "Opção inválida" };
      return { ok: true, value: raw };
    }
    case "multiple": {
      if (!Array.isArray(raw) || !raw.every((v) => typeof v === "string" && optionIds.has(v)))
        return { ok: false, error: "Opções inválidas" };
      const unique = [...new Set(raw as string[])];
      if (question.maxSelections > 0 && unique.length > question.maxSelections)
        return { ok: false, error: `Selecione no máximo ${question.maxSelections}` };
      return { ok: true, value: unique };
    }
    case "text": {
      if (typeof raw !== "string") return { ok: false, error: "Texto inválido" };
      const text = raw.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 500);
      return { ok: true, value: text };
    }
    case "number":
    case "range": {
      const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.replace(",", ".")) : NaN;
      if (!Number.isFinite(n)) return { ok: false, error: "Número inválido" };
      if (question.type === "range" && (n < question.min || n > question.max))
        return { ok: false, error: "Valor fora da faixa" };
      return { ok: true, value: n };
    }
  }
}

function addAttr(attrs: Attributes, key: string, value: string | number, asList: boolean) {
  if (!key) return;
  const current = attrs[key];
  if (!asList || current === undefined) {
    attrs[key] = asList ? [String(value)] : value;
    return;
  }
  const list = Array.isArray(current) ? current : [String(current)];
  if (!list.includes(String(value))) list.push(String(value));
  attrs[key] = list;
}

export type Derived = { attributes: Attributes; score: number; tags: string[] };

/** Converte respostas em atributos, pontuação e tags conforme a configuração das opções. */
export function deriveAttributes(quiz: Quiz, answers: Answers): Derived {
  const attributes: Attributes = {};
  const tags = new Set<string>();
  let score = 0;

  for (const q of quiz.questions) {
    const answer = answers[q.id];
    if (answer === undefined || answer === null) continue;

    if (q.type === "single" || q.type === "yes_no" || q.type === "multiple") {
      const ids = Array.isArray(answer) ? answer : [String(answer)];
      const isList = q.type === "multiple";
      if (isList && q.attributeKey) attributes[q.attributeKey] = [];
      for (const optId of ids) {
        const opt = q.options.find((o) => o.id === optId);
        if (!opt) continue;
        score += opt.score;
        opt.tags.forEach((t) => tags.add(t));
        addAttr(attributes, q.attributeKey, opt.value || opt.id, isList);
        for (const [k, v] of Object.entries(opt.attributes)) addAttr(attributes, k, v, isList);
      }
    } else if (q.attributeKey) {
      attributes[q.attributeKey] = answer as string | number;
    }
  }
  return { attributes, score, tags: [...tags] };
}

import { describe, expect, it } from "vitest";
import { emptyConfig, publishIssues, type CampaignConfig, type Condition } from "@/lib/domain/config";
import { deriveAttributes, normalizeAnswer } from "@/lib/engine/answers";
import { evaluateCondition, evaluateGroup, resolveProfile } from "@/lib/engine/rules";
import { builtinTemplates } from "@/lib/templates/builtin";

const renda = () => structuredClone(builtinTemplates.find((t) => t.key === "renda-extra")!.config) as CampaignConfig;
const cond = (c: Partial<Condition>): Condition => ({ kind: "condition", id: "c", source: "attribute", target: "x", operator: "equals", value: "", ...c });

describe("normalizeAnswer", () => {
  const config = renda();
  const byId = (id: string) => config.quiz.questions.find((q) => q.id === id)!;

  it("aceita opção válida e rejeita opção inexistente", () => {
    expect(normalizeAnswer(byId("tempo"), "tempo_ate_1h")).toEqual({ ok: true, value: "tempo_ate_1h" });
    expect(normalizeAnswer(byId("tempo"), "hack").ok).toBe(false);
  });
  it("exige resposta em pergunta obrigatória e permite pular opcional", () => {
    expect(normalizeAnswer(byId("tempo"), "").ok).toBe(false);
    expect(normalizeAnswer(byId("motivo"), "")).toEqual({ ok: true, value: null });
  });
  it("múltipla escolha remove duplicadas e respeita limite", () => {
    const q = { ...byId("canais"), maxSelections: 2 };
    expect(normalizeAnswer(q, ["canais_whatsapp", "canais_whatsapp"])).toEqual({ ok: true, value: ["canais_whatsapp"] });
    expect(normalizeAnswer(q, ["canais_whatsapp", "canais_instagram", "canais_presencial"]).ok).toBe(false);
  });
  it("faixa valida limites e texto remove caracteres de controle", () => {
    const range = { ...byId("tempo"), type: "range" as const, min: 0, max: 10 };
    expect(normalizeAnswer(range, 11).ok).toBe(false);
    expect(normalizeAnswer(range, "5")).toEqual({ ok: true, value: 5 });
    expect(normalizeAnswer(byId("motivo"), "oi\u0000 tudo")).toEqual({ ok: true, value: "oi  tudo" });
  });
});

describe("deriveAttributes", () => {
  it("registra atributo da pergunta, atributos extras e pontuação", () => {
    const config = renda();
    config.quiz.questions[3].options[2].attributes = { faixa_alta: "sim" };
    config.quiz.questions[3].options[2].score = 5;
    const d = deriveAttributes(config.quiz, { objetivo: "objetivo_1000_2000", canais: ["canais_whatsapp", "canais_instagram"] });
    expect(d.attributes.objetivo_financeiro).toBe("1000_2000");
    expect(d.attributes.faixa_alta).toBe("sim");
    expect(d.attributes.canais).toEqual(["whatsapp", "instagram"]);
    expect(d.score).toBe(5);
  });
});

describe("evaluateCondition", () => {
  const ctx = { answers: { q1: "o1" }, attributes: { x: "Vendas", n: 10, list: ["a", "b"] }, score: 7 };
  it("equals ignora maiúsculas e compara números", () => {
    expect(evaluateCondition(cond({ value: "vendas" }), ctx)).toBe(true);
    expect(evaluateCondition(cond({ target: "n", value: "10" }), ctx)).toBe(true);
  });
  it("contains funciona em texto e em listas", () => {
    expect(evaluateCondition(cond({ operator: "contains", value: "end" }), ctx)).toBe(true);
    expect(evaluateCondition(cond({ target: "list", operator: "contains", value: "b" }), ctx)).toBe(true);
    expect(evaluateCondition(cond({ target: "list", operator: "not_contains", value: "z" }), ctx)).toBe(true);
  });
  it("maior/menor e pontuação", () => {
    expect(evaluateCondition(cond({ target: "n", operator: "gt", value: "9" }), ctx)).toBe(true);
    expect(evaluateCondition(cond({ target: "n", operator: "lt", value: "9" }), ctx)).toBe(false);
    expect(evaluateCondition(cond({ source: "score", operator: "gte", value: "7" }), ctx)).toBe(true);
  });
  it("resposta por id de opção e respondida/não respondida", () => {
    expect(evaluateCondition(cond({ source: "answer", target: "q1", value: "o1" }), ctx)).toBe(true);
    expect(evaluateCondition(cond({ source: "answer", target: "q2", operator: "not_answered" }), ctx)).toBe(true);
    expect(evaluateCondition(cond({ target: "ausente", operator: "gt", value: "1" }), ctx)).toBe(false);
  });
  it("grupos AND/OR aninhados; grupo vazio não é atendido", () => {
    const yes = cond({ value: "vendas" });
    const no = cond({ value: "outra" });
    expect(evaluateGroup({ kind: "group", id: "g", combinator: "and", children: [yes, no] }, ctx)).toBe(false);
    expect(evaluateGroup({ kind: "group", id: "g", combinator: "or", children: [no, { kind: "group", id: "g2", combinator: "and", children: [yes] }] }, ctx)).toBe(true);
    expect(evaluateGroup({ kind: "group", id: "g", combinator: "and", children: [] }, ctx)).toBe(false);
  });
});

describe("resolveProfile", () => {
  it("exemplo do briefing: até 1h + até R$ 50 + vendas → vendedor de baixo investimento", () => {
    const r = resolveProfile(renda(), { tempo: "tempo_ate_1h", capital: "capital_ate_50", preferencia: "preferencia_vendas" });
    expect(r.profile?.id).toBe("vendedor");
    expect(r.matchedRuleId).toBe("r_vendedor");
  });
  it("primeira regra atendida vence, na ordem configurada", () => {
    const r = resolveProfile(renda(), { tempo: "tempo_mais_3h", preferencia: "preferencia_vendas" });
    expect(r.matchedRuleId).toBe("r_vendas");
  });
  it("sem regra atendida → resultado padrão", () => {
    const r = resolveProfile(renda(), { tempo: "tempo_ate_1h", preferencia: "preferencia_conteudo" });
    expect(r.profile?.id).toBe("explorador");
    expect(r.matchedRuleId).toBeNull();
  });
  it("regras desativadas são ignoradas", () => {
    const c = renda();
    c.rules.forEach((r) => (r.enabled = false));
    expect(resolveProfile(c, { preferencia: "preferencia_vendas" }).profile?.id).toBe("explorador");
  });
});

describe("publishIssues", () => {
  it("bloqueia publicação incompleta", () => {
    const issues = publishIssues(emptyConfig());
    expect(issues.join(" ")).toMatch(/pergunta/);
    expect(issues.join(" ")).toMatch(/checkout/);
  });
  it("exige justificativa para preço de referência", () => {
    const c = renda();
    c.offer.checkoutUrl = "https://pay.exemplo.com/x";
    c.offer.priceCents = 9700;
    c.offer.referencePriceCents = 19700;
    expect(publishIssues(c).some((i) => i.includes("preço de referência"))).toBe(true);
    c.offer.referencePriceNote = "Preço praticado até 01/09";
    expect(publishIssues(c)).toEqual([]);
  });
  it("todos os modelos embutidos são válidos", () => {
    for (const t of builtinTemplates) {
      const c = structuredClone(t.config);
      c.offer.checkoutUrl = "https://pay.exemplo.com/x";
      expect(publishIssues(c), t.key).toEqual([]);
    }
  });
});

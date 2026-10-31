import { describe, expect, it } from "vitest";
import { publishIssues, type Block, type CampaignConfig } from "@/lib/domain/config";
import { resolveProfile } from "@/lib/engine/rules";
import { answerLabel, matchedInsights, visibleBlocks } from "@/components/public/sales-page";
import { builtinTemplates } from "@/lib/templates/builtin";

const rota = () => structuredClone(builtinTemplates.find((t) => t.key === "rota-invisivel")!.config) as CampaignConfig;

const answersFor = (pref: string, extra: Record<string, string> = {}) => ({
  objetivo: "objetivo_1000_2000",
  tempo: "tempo_ate_1h",
  capital: "capital_ate_50",
  preferencia: `preferencia_${pref}`,
  dificuldade: "dificuldade_por_onde_comecar",
  onde: "onde_ambos",
  experiencia: "no",
  ...extra,
});

function personalized(c: CampaignConfig) {
  return c.salesPage.blocks.find((b) => b.type === "personalized") as Extract<Block, { type: "personalized" }>;
}

describe("visibleBlocks — grupos de variação", () => {
  const blocks = rota().salesPage.blocks;
  const heroes = (pid: string | null) => visibleBlocks(blocks, pid).filter((b) => b.type === "hero") as Extract<Block, { type: "hero" }>[];

  it("exibe exatamente um hero por visitante", () => {
    for (const pid of [null, "vendedor", "servicos", "conteudo", "explorador"]) expect(heroes(pid)).toHaveLength(1);
  });
  it("perfil com variação recebe a sua; sem variação recebe a versão geral", () => {
    expect(heroes("vendedor")[0].headline).toMatch(/estoque/);
    expect(heroes("servicos")[0].headline).toMatch(/sabe fazer/);
    expect(heroes(null)[0].headline).toMatch(/^Você não precisa de mais dinheiro/);
    expect(heroes("explorador")[0].headline).toMatch(/^Você não precisa de mais dinheiro/);
  });
  it("blocos sem grupo seguem a regra de visibilidade por perfil", () => {
    const b1 = { ...blocks[0], id: "x", group: "", profileIds: ["vendedor"] } as Block;
    expect(visibleBlocks([b1], "servicos")).toHaveLength(0);
    expect(visibleBlocks([b1], "vendedor")).toHaveLength(1);
    expect(visibleBlocks([b1], null)).toHaveLength(0);
  });
});

describe("resultado personalizado", () => {
  it("rótulos vêm das respostas reais; perguntas não respondidas são omitidas", () => {
    const c = rota();
    const a = answersFor("vendas");
    expect(answerLabel(c.quiz, a, "capital")).toBe("Até R$ 50");
    expect(answerLabel(c.quiz, a, "tempo")).toBe("Até 1 hora por dia");
    expect(answerLabel(c.quiz, { ...a, capital: undefined as unknown as string }, "capital")).toBeNull();
    expect(answerLabel(c.quiz, a, "inexistente")).toBeNull();
  });

  it.each([
    ["vendas", "vendedor", "Vender sem montar estoque"],
    ["servicos", "servicos", "Transformar habilidades em serviços"],
    ["conteudo", "conteudo", "Do conteúdo à monetização"],
    ["indefinido", "explorador", "Comparar antes de escolher"],
  ])("preferência %s → perfil %s com interpretação coerente", (pref, profileId, insight) => {
    const c = rota();
    const a = answersFor(pref);
    const r = resolveProfile(c, a);
    expect(r.profile?.id).toBe(profileId);
    const titles = matchedInsights(personalized(c), { quiz: c.quiz, answers: a, attributes: r.attributes, score: r.score }).map((i) => i.title);
    expect(titles[0]).toBe(insight);
    expect(titles).toContain("Começar com pouco investimento"); // capital até R$ 50
    expect(titles.length).toBeLessThanOrEqual(4);
  });

  it("interpretações acompanham as respostas (sem até R$ 50 → sem baixo investimento)", () => {
    const c = rota();
    const a = answersFor("vendas", { capital: "capital_mais_300", tempo: "tempo_mais_3h", dificuldade: "dificuldade_clientes" });
    const r = resolveProfile(c, a);
    const titles = matchedInsights(personalized(c), { quiz: c.quiz, answers: a, attributes: r.attributes, score: r.score }).map((i) => i.title);
    expect(titles).not.toContain("Começar com pouco investimento");
    expect(titles).not.toContain("Atividades para períodos curtos");
    expect(titles).toContain("Encontrar os primeiros clientes");
  });

  it("modelo não inventa garantia, preço anterior nem depoimentos", () => {
    const c = rota();
    expect(c.offer.guarantee).toBe("");
    expect(c.offer.guaranteeDays).toBeNull();
    expect(c.offer.referencePriceCents).toBeNull();
    expect(c.salesPage.blocks.some((b) => b.type === "testimonials")).toBe(false);
    expect(c.offer.priceCents).toBe(1990);
    c.offer.checkoutUrl = "https://pay.exemplo.com/rota";
    expect(publishIssues(c)).toEqual([]);
  });
});

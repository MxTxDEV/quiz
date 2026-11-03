import { describe, expect, it } from "vitest";
import { publishIssues, type Block, type CampaignConfig } from "@/lib/domain/config";
import { resolveProfile } from "@/lib/engine/rules";
import { answerLabel, matchedInsights, visibleBlocks } from "@/components/public/sales-page";
import { builtinTemplates } from "@/lib/templates/builtin";

const rota = () => structuredClone(builtinTemplates.find((t) => t.key === "rota-invisivel")!.config) as CampaignConfig;

const answersFor = (pref: string, extra: Record<string, string> = {}) => ({
  situacao: "situacao_sobra_pouco",
  dificuldade: "dificuldade_por_onde_comecar",
  dor: "dor_planos",
  objetivo: "objetivo_500_1000",
  conquista: "conquista_tranquilidade",
  preferencia: `preferencia_${pref}`,
  tempo: "tempo_1_3h",
  ...extra,
});

function personalized(c: CampaignConfig) {
  return c.salesPage.blocks.find((b) => b.type === "personalized") as Extract<Block, { type: "personalized" }>;
}

describe("visibleBlocks — grupos de variação", () => {
  const blocks = rota().salesPage.blocks;
  it("exibe exatamente um hero por visitante", () => {
    for (const pid of [null, "vendedor", "servicos_locais", "conteudo", "explorador"])
      expect(visibleBlocks(blocks, pid).filter((b) => b.type === "hero")).toHaveLength(1);
  });
  it("blocos sem grupo seguem a regra de visibilidade por perfil", () => {
    const b1 = { ...blocks[0], id: "x", group: "", profileIds: ["vendedor"] } as Block;
    expect(visibleBlocks([b1], "servicos_locais")).toHaveLength(0);
    expect(visibleBlocks([b1], "vendedor")).toHaveLength(1);
    expect(visibleBlocks([b1], null)).toHaveLength(0);
  });
});

describe("bloco personalizado da página de vendas", () => {
  it("rótulos vêm das respostas reais; perguntas não respondidas são omitidas", () => {
    const c = rota();
    const a = answersFor("vendas");
    expect(answerLabel(c.quiz, a, "tempo")).toBe("De 1 a 3 horas.");
    expect(answerLabel(c.quiz, { ...a, tempo: undefined as unknown as string }, "tempo")).toBeNull();
    expect(answerLabel(c.quiz, a, "inexistente")).toBeNull();
  });

  it.each([
    ["vendas", {}, "Vendas sem manter estoque"],
    ["servicos", { dificuldade: "dificuldade_clientes" }, "Transformar habilidades em serviços"],
    ["internet", { dificuldade: "dificuldade_clientes" }, "Renda pela internet com ferramentas gratuitas"],
    ["indefinido", {}, "Escolher seu primeiro caminho"],
  ])("preferência %s → texto coerente com o conteúdo do guia", (pref, extra, insight) => {
    const c = rota();
    const a = answersFor(pref, extra as Record<string, string>);
    const r = resolveProfile(c, a);
    const titles = matchedInsights(personalized(c), { quiz: c.quiz, answers: a, attributes: r.attributes, score: r.score }).map((i) => i.title);
    expect(titles).toContain(insight);
    expect(titles.length).toBeLessThanOrEqual(3);
  });

  it("pouco tempo e 'já tentei' ganham textos próprios", () => {
    const c = rota();
    const a = answersFor("vendas", { tempo: "tempo_ate_1h", dificuldade: "dificuldade_ja_tentou" });
    const r = resolveProfile(c, a);
    const titles = matchedInsights(personalized(c), { quiz: c.quiz, answers: a, attributes: r.attributes, score: r.score }).map((i) => i.title);
    expect(titles[0]).toBe("Estruturar a execução desta vez");
    expect(titles).toContain("Alternativas para uma rotina com pouco tempo");
  });

  it("modelo não inventa garantia, preço anterior nem depoimentos; checkout e preço preservados", () => {
    const c = rota();
    expect(c.offer.guarantee).toBe("");
    expect(c.offer.guaranteeDays).toBeNull();
    expect(c.offer.referencePriceCents).toBeNull();
    expect(c.salesPage.blocks.some((b) => b.type === "testimonials")).toBe(false);
    expect(c.offer.priceCents).toBe(1990);
    expect(c.offer.checkoutUrl).toBe("https://pay.kiwify.com.br/7fyz1pO");
    expect(publishIssues(c)).toEqual([]); // publicável sem ajustes
  });
});

describe("página de vendas reestruturada", () => {
  it("segue a estrutura: hero → problema → solução → prévia → capítulos → bônus → para quem → oferta → FAQ → CTA", () => {
    const types = rota().salesPage.blocks.map((b) => b.type);
    const order = ["hero", "text", "preview", "content", "bonuses", "fit", "offerCard", "faq", "ctaSection", "footer"];
    let last = -1;
    for (const t of order) {
      const i = types.indexOf(t as Block["type"], last + 1);
      expect(i, t).toBeGreaterThan(last);
      last = i;
    }
  });
  it("prévia usa somente recortes reais existentes no projeto", async () => {
    const { existsSync } = await import("node:fs");
    const prev = rota().salesPage.blocks.find((b) => b.type === "preview") as Extract<Block, { type: "preview" }>;
    expect(prev.items).toHaveLength(5);
    for (const it of prev.items) expect(existsSync(`public${it.imageUrl}`), it.imageUrl).toBe(true);
  });
  it("campanhas antigas ganham os efeitos sem precisar republicar", async () => {
    const { parseConfig } = await import("@/lib/domain/config");
    const old = rota() as unknown as { salesPage: Record<string, unknown> };
    delete old.salesPage.effects;
    expect(parseConfig(old).salesPage.effects).toBe(true);
  });
});

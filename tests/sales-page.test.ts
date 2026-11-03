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
    expect(answerLabel(c.quiz, a, "capital")).toBe("Até R$ 50");
    expect(answerLabel(c.quiz, a, "tempo")).toBe("Até 1 hora");
    expect(answerLabel(c.quiz, { ...a, capital: undefined as unknown as string }, "capital")).toBeNull();
    expect(answerLabel(c.quiz, a, "inexistente")).toBeNull();
  });

  it.each([
    ["vendas", "vendedor", "Vender sem montar estoque"],
    ["servicos", "servicos_locais", "Transformar habilidades em serviços"],
    ["internet", "servicos_digitais", "Trabalhar pela internet com ferramentas gratuitas"],
    ["conteudo", "conteudo", "Do conteúdo à monetização"],
    ["indefinido", "iniciante", "Comparar antes de escolher"],
  ])("preferência %s → perfil %s com interpretação coerente", (pref, profileId, insight) => {
    const c = rota();
    const a = answersFor(pref);
    const r = resolveProfile(c, a);
    expect(r.profile?.id).toBe(profileId);
    const titles = matchedInsights(personalized(c), { quiz: c.quiz, answers: a, attributes: r.attributes, score: r.score }).map((i) => i.title);
    expect(titles[0]).toBe(insight);
    expect(titles).toContain("Começar com pouco investimento"); // capital até R$ 50
    expect(titles.length).toBeLessThanOrEqual(3);
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

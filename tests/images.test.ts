import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { publishIssues, type Block, type CampaignConfig } from "@/lib/domain/config";
import { imageUrlProblem, usableImageUrl } from "@/lib/domain/images";
import { SalesPageView } from "@/components/public/sales-page";
import { builtinTemplates } from "@/lib/templates/builtin";

const CHECKOUT = "https://pay.kiwify.com.br/7fyz1pO";
const rota = () => structuredClone(builtinTemplates.find((t) => t.key === "rota-invisivel")!.config) as CampaignConfig;

describe("links em campos de imagem", () => {
  it("rejeita o link do checkout e links de páginas", () => {
    expect(imageUrlProblem(CHECKOUT, CHECKOUT)).toMatch(/checkout/);
    expect(imageUrlProblem(CHECKOUT)).toMatch(/página/);
    expect(imageUrlProblem("https://pay.hotmart.com/X123")).toMatch(/página/);
    expect(imageUrlProblem("https://drive.google.com/file/d/abc/view")).toMatch(/página/);
    expect(imageUrlProblem("javascript:alert(1)")).toBeTruthy();
    expect(imageUrlProblem("capa.png")).toBeTruthy();
  });
  it("aceita imagens reais, arquivos do próprio site e campo vazio", () => {
    expect(imageUrlProblem("https://cdn.exemplo.com/capa-rota.png", CHECKOUT)).toBeNull();
    expect(imageUrlProblem("https://static-media.hotmart.com/abc/capa.jpg")).toBeNull();
    expect(imageUrlProblem("/produto/capa.webp")).toBeNull();
    expect(imageUrlProblem("")).toBeNull();
    expect(usableImageUrl(CHECKOUT, CHECKOUT)).toBe("");
  });
  it("publicação é bloqueada quando a capa do topo aponta para o checkout", () => {
    const c = rota();
    const hero = c.salesPage.blocks.find((b) => b.type === "hero") as Extract<Block, { type: "hero" }>;
    hero.imageUrl = CHECKOUT;
    c.offer.coverImageUrl = CHECKOUT;
    const issues = publishIssues(c);
    expect(issues.some((i) => i.startsWith("Imagem do bloco de topo"))).toBe(true);
    expect(issues.some((i) => i.startsWith("Capa do produto"))).toBe(true);
    expect(publishIssues(rota()).filter((i) => /imagem|capa|logo/i.test(i))).toEqual([]);
  });
  it("página pública nunca renderiza o checkout como <img> — usa a capa gerada", () => {
    const c = rota();
    for (const b of c.salesPage.blocks) if (b.type === "hero") b.imageUrl = CHECKOUT;
    c.offer.coverImageUrl = CHECKOUT;
    const html = renderToStaticMarkup(
      createElement(SalesPageView, { page: c.salesPage, offer: c.offer, ctx: { profile: null, checkoutHref: () => CHECKOUT, personal: null } }),
    );
    expect(html).not.toMatch(/<img[^>]+src="https:\/\/pay\.kiwify/);
    expect(html).toContain("ROTA INVISÍVEL".toUpperCase().slice(0, 4));
  });
});

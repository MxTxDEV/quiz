import { beforeEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createCampaign, getPublishedCampaignBySlug, publishCampaign } from "@/lib/services/campaigns";
import { installBuiltinTemplates, listTemplates } from "@/lib/services/templates";
import { recordPurchase } from "@/lib/services/purchases";
import { displayName, listReviews, setReviewStatus, socialProof, submitReview } from "@/lib/services/reviews";
import { SalesPageView } from "@/components/public/sales-page";
import { resetDb } from "./helpers";

beforeEach(resetDb);

async function rotaPublished() {
  await installBuiltinTemplates();
  const tpl = (await listTemplates()).find((t) => t.key === "rota-invisivel")!;
  const c = await createCampaign({ name: "Rota", slug: "rota", templateId: tpl.id });
  expect((await publishCampaign(c.id)).ok).toBe(true);
  return c;
}
const base = { name: "maria aparecida souza", city: "Recife", rating: 5, text: "Gostei muito do plano de 30 dias, me ajudou a organizar.", email: "Maria@Email.com", consent: true as const };

describe("avaliações de compradores", () => {
  it("exibe só primeiro nome + inicial", () => {
    expect(displayName("maria aparecida souza")).toBe("Maria S.");
    expect(displayName("JOÃO")).toBe("João");
  });

  it("validações: autorização obrigatória, texto mínimo, campanha publicada, anti-robô", async () => {
    await rotaPublished();
    await expect(submitReview("rota", { ...base, consent: false as never }, "1.1.1.1")).rejects.toThrow(/autorizar/);
    await expect(submitReview("rota", { ...base, text: "bom" }, "1.1.1.1")).rejects.toThrow(/mínimo/);
    await expect(submitReview("nao-existe", base, "1.1.1.1")).rejects.toThrow(/não encontrada/);
    await expect(submitReview("rota", { ...base, elapsedMs: 300 }, "1.1.1.1")).rejects.toThrow(/rápido/);
  });

  it("pendente até aprovar; compra verificada pelo e-mail da venda; contador real", async () => {
    const c = await rotaPublished();
    await recordPurchase("kiwify", { externalId: "K1", status: "confirmed", amountCents: 1990, currency: "BRL", sessionId: null }, { campaignId: c.id, raw: { Customer: { email: "maria@email.com" } } });

    const r1 = await submitReview("rota", base, "1.1.1.1");
    expect(r1.verified).toBe(true);
    const r2 = await submitReview("rota", { ...base, name: "Ana", email: "ana@x.com", rating: 4 }, "2.2.2.2");
    expect(r2.verified).toBe(false);

    let sp = await socialProof(c.id);
    expect(sp.reviews).toHaveLength(0); // nada aparece sem aprovação
    expect(sp.buyers).toBe(1);

    const rows = await listReviews(c.id);
    for (const r of rows) await setReviewStatus(r.id, "approved");
    sp = await socialProof(c.id);
    expect(sp.reviews.map((r) => r.name)).toEqual(["Maria S.", "Ana"]); // verificadas primeiro
    expect(sp.average).toBe(4.5);
    expect(JSON.stringify(sp)).not.toContain("@"); // e-mail nunca vai para a página

    // reenvio do mesmo e-mail atualiza e volta para aprovação
    await submitReview("rota", { ...base, text: "Atualizando: estou aplicando as ideias do capítulo de clientes." }, "1.1.1.1");
    expect((await listReviews(c.id)).filter((r) => r.email === "maria@email.com")).toHaveLength(1);
    expect((await socialProof(c.id)).reviews.map((r) => r.name)).toEqual(["Ana"]);
  });

  it("página: bloco oculto sem avaliações; contador só acima do mínimo", async () => {
    const c = await rotaPublished();
    const live = (await getPublishedCampaignBySlug("rota"))!;
    const render = (social: Awaited<ReturnType<typeof socialProof>>) =>
      renderToStaticMarkup(createElement(SalesPageView, { page: live.config.salesPage, offer: live.config.offer, ctx: { profile: null, checkoutHref: () => "#", personal: null, social } }));
    expect(render(await socialProof(c.id))).not.toContain("Quem comprou, avalia");
    const html = render({ reviews: [{ id: "1", name: "Maria S.", city: "Recife", rating: 5, text: "Muito bom.", verified: true, createdAt: "" }], reviewCount: 1, average: 5, buyers: 3 });
    expect(html).toContain("Quem comprou, avalia");
    expect(html).toContain("Compra verificada");
    expect(html).not.toContain("pessoas já acessaram"); // 3 < mínimo de 10
    expect(render({ reviews: [], reviewCount: 0, average: null, buyers: 25 })).toContain("25 pessoas já acessaram");
  });
});

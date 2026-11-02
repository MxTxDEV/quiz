import { uid } from "@/lib/utils";
import {
  emptyConfig,
  blockSchema,
  type Block,
  type BlockType,
  type CampaignConfig,
  type Offer,
  type Profile,
  type Question,
  type QuestionType,
} from "./config";
import type { Product } from "@/lib/db/schema";

export function newOption(label = "Nova opção") {
  return { id: uid("o"), label, value: "", score: 0, attributes: {}, tags: [] };
}

export function newQuestion(type: QuestionType): Question {
  const base: Question = {
    id: uid("q"),
    type,
    title: "Nova pergunta",
    description: "",
    imageUrl: "",
    required: true,
    attributeKey: "",
    options: [],
    maxSelections: 0,
    placeholder: "",
    min: 0,
    max: 100,
    step: 1,
    prefix: "",
    suffix: "",
    feedback: "",
  };
  if (type === "single" || type === "multiple") base.options = [newOption("Opção 1"), newOption("Opção 2")];
  if (type === "yes_no")
    base.options = [
      { id: "yes", label: "Sim", value: "sim", score: 0, attributes: {}, tags: [] },
      { id: "no", label: "Não", value: "nao", score: 0, attributes: {}, tags: [] },
    ];
  if (type === "text") base.placeholder = "Digite sua resposta";
  if (type === "number") base.placeholder = "0";
  return base;
}

/** Ao trocar o tipo, preserva o que for compatível. */
export function changeQuestionType(q: Question, type: QuestionType): Question {
  const fresh = newQuestion(type);
  const keepOptions = (q.type === "single" || q.type === "multiple") && (type === "single" || type === "multiple");
  return {
    ...fresh,
    id: q.id,
    title: q.title,
    description: q.description,
    imageUrl: q.imageUrl,
    required: q.required,
    attributeKey: q.attributeKey,
    feedback: q.feedback,
    options: keepOptions ? q.options : fresh.options,
  };
}

export function newProfile(name = "Novo perfil", isDefault = false): Profile {
  return {
    id: uid("p"),
    name,
    title: "",
    subtitle: "",
    description: "",
    imageUrl: "",
    highlights: [],
    recommendations: [],
    content: "",
    ctaLabel: "Ver recomendação",
    ctaTarget: "sales_page",
    isDefault,
  };
}

export const blockLabels: Record<BlockType, string> = {
  hero: "Hero (primeira dobra)",
  personalized: "Resultado personalizado do quiz",
  text: "Seção de texto",
  headline: "Headline",
  subheadline: "Subheadline",
  image: "Imagem",
  video: "Vídeo",
  mockup: "Mockup do produto",
  benefits: "Lista de benefícios",
  content: "Apresentação do conteúdo / capítulos",
  bonuses: "Bônus",
  testimonials: "Depoimentos",
  reviews: "Avaliações de compradores (automático)",
  faq: "Perguntas frequentes",
  offerCard: "Card da oferta",
  price: "Preço",
  cta: "Botão de compra",
  guarantee: "Garantia",
  ctaSection: "CTA final",
  footer: "Rodapé",
};

const starters: { [K in BlockType]?: Record<string, unknown> } = {
  hero: { badge: "Produto digital", headline: "Sua headline principal", subheadline: "Explique em uma frase o que a pessoa recebe.", ctaLabel: "", ctaAction: "offer" },
  personalized: { title: "Seu próximo passo começa pelo que você respondeu." },
  text: { title: "Título da seção", body: "Texto da seção." },
  headline: { text: "Sua headline aqui" },
  subheadline: { text: "Explique em uma frase o que a pessoa recebe." },
  offerCard: { title: "Seu acesso" },
  ctaSection: { headline: "Chamada final", subheadline: "", ctaAction: "checkout" },
  testimonials: { title: "Depoimentos" },
};

/** Novo bloco com os padrões do schema (fonte única de verdade). */
export function newBlock(type: BlockType): Block {
  return blockSchema.parse({ id: uid("b"), type, ...(starters[type] ?? {}) });
}

export function offerFromProduct(product: Product | null | undefined, current?: Offer): Offer {
  const base = current ?? emptyConfig().offer;
  if (!product) return base;
  return {
    ...base,
    priceCents: product.priceCents,
    referencePriceCents: product.referencePriceCents,
    referencePriceNote: product.referencePriceNote,
    description: product.description,
    benefits: product.benefits,
    checkoutUrl: product.checkoutUrl,
    guarantee: product.guarantee,
    productName: product.name,
    coverImageUrl: product.coverImageUrl,
    bonuses: product.bonuses.map((b) => ({ title: b.title, description: b.description, imageUrl: b.imageUrl ?? "" })),
  };
}

/** Estrutura inicial de uma campanha "do zero": sem perguntas fixas, apenas o esqueleto. */
export function starterConfig(product?: Product | null): CampaignConfig {
  const config = emptyConfig();
  config.offer = offerFromProduct(product);
  config.profiles = [newProfile("Resultado padrão", true)];
  config.quiz.intro.title = product ? `Descubra o melhor caminho para você` : "";
  const blocks: BlockType[] = ["headline", "subheadline", "benefits", "bonuses", "price", "cta", "guarantee", "faq", "footer"];
  config.salesPage.blocks = blocks.map(newBlock);
  if (product) {
    const h = config.salesPage.blocks[0];
    if (h.type === "headline") h.text = product.name;
  }
  return config;
}

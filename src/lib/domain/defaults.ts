import { uid } from "@/lib/utils";
import {
  emptyConfig,
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
  headline: "Headline",
  subheadline: "Subheadline",
  image: "Imagem",
  video: "Vídeo",
  mockup: "Mockup do produto",
  benefits: "Lista de benefícios",
  content: "Apresentação do conteúdo",
  bonuses: "Bônus",
  testimonials: "Depoimentos",
  faq: "Perguntas frequentes",
  price: "Preço",
  cta: "Botão de compra",
  guarantee: "Garantia",
  footer: "Rodapé",
};

export function newBlock(type: BlockType): Block {
  const base = { id: uid("b"), profileIds: [] as string[] };
  switch (type) {
    case "headline":
      return { ...base, type, text: "Sua headline aqui", align: "center" };
    case "subheadline":
      return { ...base, type, text: "Explique em uma frase o que a pessoa recebe.", align: "center" };
    case "image":
      return { ...base, type, url: "", alt: "" };
    case "video":
      return { ...base, type, url: "" };
    case "mockup":
      return { ...base, type, url: "", caption: "" };
    case "benefits":
      return { ...base, type, title: "O que você vai conseguir", useOffer: true, items: [] };
    case "content":
      return { ...base, type, title: "O que está incluído", items: [] };
    case "bonuses":
      return { ...base, type, title: "Bônus incluídos", useOffer: true };
    case "testimonials":
      return { ...base, type, title: "Depoimentos", items: [] };
    case "faq":
      return { ...base, type, title: "Perguntas frequentes", items: [] };
    case "price":
      return { ...base, type, title: "" };
    case "cta":
      return { ...base, type, label: "", note: "" };
    case "guarantee":
      return { ...base, type, title: "Garantia", text: "" };
    case "footer":
      return { ...base, type, text: "" };
  }
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
    bonuses: product.bonuses,
    checkoutUrl: product.checkoutUrl,
    guarantee: product.guarantee,
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

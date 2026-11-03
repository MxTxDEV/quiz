import { z } from "zod";
import { imageUrlProblem } from "./images";

/**
 * Contrato único da configuração de uma campanha.
 * Editor, API pública, motor de regras e renderizadores dependem apenas destes tipos.
 */

const id = z.string().min(1).max(64);
const shortText = z.string().max(300);
const longText = z.string().max(5000);
const url = z
  .string()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Use uma URL iniciando com http:// ou https://");
/** imagem: URL completa ou arquivo do próprio site ("/produto/...") */
const assetUrl = z
  .string()
  .max(2000)
  .refine((v) => v === "" || /^https?:\/\//i.test(v) || /^\/(?!\/)/.test(v), "Use uma URL iniciando com https:// ou um caminho do site iniciando com /");
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (use #RRGGBB)");
const cents = z.number().int().min(0).max(100_000_000);

// ---------- Tema ----------

export const fontSchema = z.enum(["inter", "system", "serif", "rounded"]);

export const themeSchema = z.object({
  background: color.default("#ffffff"),
  surface: color.default("#f6f6f7"),
  text: color.default("#111113"),
  muted: color.default("#6b6b76"),
  accent: color.default("#4f46e5"),
  accentText: color.default("#ffffff"),
  font: fontSchema.default("inter"),
  radius: z.number().int().min(0).max(32).default(12),
  baseFontSize: z.number().int().min(14).max(22).default(16),
  spacing: z.enum(["compact", "normal", "relaxed"]).default("normal"),
});
export type Theme = z.infer<typeof themeSchema>;

// ---------- Quiz ----------

export const questionTypes = ["single", "multiple", "text", "number", "range", "yes_no"] as const;
export const questionTypeSchema = z.enum(questionTypes);
export type QuestionType = z.infer<typeof questionTypeSchema>;

export const attributeKeySchema = z
  .string()
  .max(60)
  .regex(/^[a-z0-9_]*$/, "Use apenas letras minúsculas, números e _");

export const optionSchema = z.object({
  id,
  label: shortText.min(1, "Informe o texto da opção"),
  /** valor salvo como atributo quando attributeKey da pergunta estiver definido */
  value: z.string().max(120).default(""),
  score: z.number().min(-1000).max(1000).default(0),
  /** atributos extras: { objetivo_financeiro: "1000_2000" } */
  attributes: z.record(attributeKeySchema, z.string().max(120)).default({}),
  tags: z.array(z.string().max(60)).max(20).default([]),
});
export type QuizOption = z.infer<typeof optionSchema>;

export const questionSchema = z.object({
  id,
  type: questionTypeSchema,
  title: shortText.min(1, "Informe o enunciado"),
  description: z.string().max(1000).default(""),
  imageUrl: url.default(""),
  required: z.boolean().default(true),
  /** atributo onde a resposta será registrada (ex.: tempo_disponivel) */
  attributeKey: attributeKeySchema.default(""),
  options: z.array(optionSchema).max(30).default([]),
  /** múltipla escolha: limite de seleções (0 = sem limite) */
  maxSelections: z.number().int().min(0).max(30).default(0),
  placeholder: z.string().max(120).default(""),
  min: z.number().default(0),
  max: z.number().default(100),
  step: z.number().positive().default(1),
  prefix: z.string().max(20).default(""),
  suffix: z.string().max(20).default(""),
  /** mensagem curta exibida após responder */
  feedback: z.string().max(200).default(""),
});
export type Question = z.infer<typeof questionSchema>;

export const quizSchema = z.object({
  intro: z
    .object({
      enabled: z.boolean().default(true),
      title: shortText.default(""),
      subtitle: z.string().max(1000).default(""),
      imageUrl: url.default(""),
      ctaLabel: z.string().max(60).default("Começar"),
      disclaimer: z.string().max(500).default(""),
    })
    .default({ enabled: true, title: "", subtitle: "", imageUrl: "", ctaLabel: "Começar", disclaimer: "" }),
  questions: z.array(questionSchema).max(60).default([]),
  /** textos da página de resultado + justificativas calculadas a partir das respostas */
  result: z
    .object({
      eyebrow: z.string().max(60).default("Análise concluída"),
      headline: shortText.default("Encontramos caminhos que podem combinar com sua realidade."),
      reasonsTitle: shortText.default("Por que esse perfil combina com você"),
      /** frases exibidas quando a condição bate; aparecem as primeiras `maxReasons` */
      reasons: z.array(z.lazy(() => reasonSchema)).max(40).default([]),
      maxReasons: z.number().int().min(1).max(6).default(3),
      pathsTitle: shortText.default("Caminhos recomendados para você"),
      firstStepTitle: shortText.default("Seu primeiro passo prático"),
      transitionTitle: shortText.default(""),
      transitionText: z.string().max(600).default(""),
    })
    .default({ eyebrow: "Análise concluída", headline: "Encontramos caminhos que podem combinar com sua realidade.", reasonsTitle: "Por que esse perfil combina com você", reasons: [], maxReasons: 3, pathsTitle: "Caminhos recomendados para você", firstStepTitle: "Seu primeiro passo prático", transitionTitle: "", transitionText: "" }),
  settings: z
    .object({
      showProgress: z.boolean().default(true),
      allowBack: z.boolean().default(true),
      autoAdvance: z.boolean().default(true),
      transitionMessage: z.string().max(200).default("Analisando suas respostas..."),
    })
    .default({ showProgress: true, allowBack: true, autoAdvance: true, transitionMessage: "Analisando suas respostas..." }),
});
export type Quiz = z.infer<typeof quizSchema>;

// ---------- Regras ----------

export const conditionSources = ["answer", "attribute", "score"] as const;
export const operators = [
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "gt",
  "gte",
  "lt",
  "lte",
  "answered",
  "not_answered",
] as const;
export type Operator = (typeof operators)[number];

export const conditionSchema = z.object({
  kind: z.literal("condition"),
  id,
  source: z.enum(conditionSources),
  /** source=answer → id da pergunta; source=attribute → chave do atributo; score → ignorado */
  target: z.string().max(64).default(""),
  operator: z.enum(operators),
  value: z.string().max(200).default(""),
});
export type Condition = z.infer<typeof conditionSchema>;

export type ConditionGroup = {
  kind: "group";
  id: string;
  combinator: "and" | "or";
  children: Array<Condition | ConditionGroup>;
};

export const conditionGroupSchema: z.ZodType<ConditionGroup> = z.lazy(() =>
  z.object({
    kind: z.literal("group"),
    id,
    combinator: z.enum(["and", "or"]),
    children: z.array(z.union([conditionSchema, conditionGroupSchema])).max(30),
  }),
);

export const reasonSchema = z.object({
  id,
  text: z.string().max(300).default(""),
  when: conditionGroupSchema,
});
export type Reason = z.infer<typeof reasonSchema>;

export const ruleSchema = z.object({
  id,
  name: shortText.default(""),
  enabled: z.boolean().default(true),
  when: conditionGroupSchema,
  profileId: id,
});
export type Rule = z.infer<typeof ruleSchema>;

// ---------- Perfis / resultados ----------

export const pathSchema = z.object({
  title: shortText.min(1),
  /** como funciona */
  how: z.string().max(500).default(""),
  /** o que é necessário para começar */
  needs: z.string().max(300).default(""),
  /** principal dificuldade */
  challenge: z.string().max(300).default(""),
  /** primeiro passo */
  firstStep: z.string().max(300).default(""),
});
export type ResultPath = z.infer<typeof pathSchema>;

export const profileSchema = z.object({
  id,
  name: shortText.min(1, "Informe o nome do perfil"),
  title: shortText.default(""),
  subtitle: z.string().max(500).default(""),
  description: longText.default(""),
  imageUrl: url.default(""),
  highlights: z.array(z.string().max(300)).max(20).default([]),
  recommendations: z.array(z.string().max(300)).max(20).default([]),
  content: longText.default(""),
  ctaLabel: z.string().max(60).default("Ver recomendação"),
  ctaTarget: z.enum(["sales_page", "checkout"]).default("sales_page"),
  isDefault: z.boolean().default(false),
  /** caminhos recomendados para este perfil (página de resultado) */
  paths: z.array(pathSchema).max(4).default([]),
  /** primeira ação prática sugerida no resultado */
  firstStep: z.string().max(600).default(""),
});
export type Profile = z.infer<typeof profileSchema>;

// ---------- Oferta ----------

export const bonusSchema = z.object({
  title: shortText.min(1),
  description: z.string().max(1000).default(""),
  /** capa do bônus; vazio = mockup gerado com a identidade da página */
  imageUrl: url.default(""),
});
export type Bonus = z.infer<typeof bonusSchema>;

export const offerSchema = z.object({
  priceCents: cents.default(0),
  referencePriceCents: cents.nullable().default(null),
  /** justificativa obrigatória quando existir preço de referência */
  referencePriceNote: z.string().max(300).default(""),
  currency: z.enum(["BRL", "USD", "EUR"]).default("BRL"),
  description: longText.default(""),
  benefits: z.array(z.string().max(300)).max(30).default([]),
  bonuses: z.array(bonusSchema).max(20).default([]),
  paymentTerms: z.string().max(300).default(""),
  checkoutUrl: url.default(""),
  buttonLabel: z.string().max(60).default("Quero garantir meu acesso"),
  guarantee: z.string().max(1000).default(""),
  /** período real de garantia em dias; null = não exibir período */
  guaranteeDays: z.number().int().min(1).max(365).nullable().default(null),
  /** nome e capa do produto (preenchidos a partir do produto cadastrado) */
  productName: z.string().max(200).default(""),
  coverImageUrl: url.default(""),
});
export type Offer = z.infer<typeof offerSchema>;

// ---------- Página de vendas ----------

const blockBase = {
  id,
  /** vazio = visível para todos os perfis */
  profileIds: z.array(id).max(50).default([]),
  /**
   * Grupo de variações: entre blocos do mesmo grupo, exibe apenas o mais específico
   * para o perfil do visitante (com perfil correspondente) ou, na falta, o genérico.
   */
  group: z.string().max(40).regex(/^[a-z0-9_-]*$/, "Use letras minúsculas, números, - e _").default(""),
  /** fundo da seção */
  tone: z.enum(["default", "surface", "contrast"]).default("default"),
};

const ctaAction = z.enum(["offer", "checkout"]).default("checkout");

export const personalizedSummarySchema = z.object({
  id,
  label: shortText.min(1),
  questionId: z.string().max(64),
});
export const personalizedInsightSchema = z.object({
  id,
  title: shortText.default(""),
  text: z.string().max(1000).default(""),
  when: conditionGroupSchema,
});
export type PersonalizedInsight = z.infer<typeof personalizedInsightSchema>;

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ ...blockBase, type: z.literal("headline"), text: shortText.default(""), align: z.enum(["left", "center"]).default("center") }),
  z.object({ ...blockBase, type: z.literal("subheadline"), text: z.string().max(1000).default(""), align: z.enum(["left", "center"]).default("center") }),
  z.object({ ...blockBase, type: z.literal("image"), url: url.default(""), alt: z.string().max(200).default("") }),
  z.object({ ...blockBase, type: z.literal("video"), url: url.default("") }),
  z.object({ ...blockBase, type: z.literal("mockup"), url: url.default(""), caption: z.string().max(200).default("") }),
  z.object({ ...blockBase, type: z.literal("benefits"), title: shortText.default("O que você vai conseguir"), useOffer: z.boolean().default(true), items: z.array(z.string().max(300)).max(30).default([]) }),
  z.object({
    ...blockBase,
    type: z.literal("content"),
    eyebrow: z.string().max(80).default(""),
    title: shortText.default("O que está incluído"),
    /** exibe os itens como capítulos numerados */
    numbered: z.boolean().default(false),
    items: z.array(z.object({ title: shortText, description: z.string().max(1000).default("") })).max(30).default([]),
  }),
  z.object({
    ...blockBase,
    type: z.literal("hero"),
    badge: z.string().max(60).default(""),
    headline: shortText.default(""),
    subheadline: z.string().max(1000).default(""),
    imageUrl: url.default(""),
    ctaLabel: z.string().max(60).default(""),
    ctaAction,
    showPrice: z.boolean().default(false),
  }),
  z.object({
    ...blockBase,
    type: z.literal("personalized"),
    eyebrow: z.string().max(80).default("Analisamos suas respostas"),
    title: shortText.default(""),
    intro: z.string().max(1000).default(""),
    summary: z.array(personalizedSummarySchema).max(12).default([]),
    insights: z.array(personalizedInsightSchema).max(30).default([]),
    maxInsights: z.number().int().min(1).max(10).default(3),
    fallbackText: z.string().max(1000).default(""),
  }),
  z.object({
    ...blockBase,
    type: z.literal("text"),
    eyebrow: z.string().max(80).default(""),
    title: shortText.default(""),
    body: z.string().max(4000).default(""),
    align: z.enum(["left", "center"]).default("left"),
    emphasis: z.enum(["normal", "statement"]).default("normal"),
    /** lista de destaques abaixo do texto */
    bullets: z.array(z.string().max(200)).max(12).default([]),
    /** exibe o mockup do produto ao lado do texto */
    showMockup: z.boolean().default(false),
  }),
  z.object({
    ...blockBase,
    type: z.literal("preview"),
    eyebrow: z.string().max(80).default("Veja por dentro"),
    title: shortText.default("Uma amostra real do material"),
    subtitle: z.string().max(500).default(""),
    /** recortes de páginas reais do produto (imagens) */
    items: z.array(z.object({ title: shortText, caption: z.string().max(300).default(""), imageUrl: assetUrl.default("") })).max(10).default([]),
    note: z.string().max(300).default(""),
  }),
  z.object({
    ...blockBase,
    type: z.literal("fit"),
    title: shortText.default("Para quem é o material"),
    yesTitle: shortText.default("É para você se"),
    yes: z.array(z.string().max(200)).max(12).default([]),
    noTitle: shortText.default("Não é para você se"),
    no: z.array(z.string().max(200)).max(12).default([]),
  }),
  z.object({
    ...blockBase,
    type: z.literal("reviews"),
    title: shortText.default("Quem comprou, avalia"),
    subtitle: z.string().max(300).default(""),
    /** quantas avaliações aprovadas exibir */
    maxItems: z.number().int().min(1).max(12).default(6),
    /** mostra "X pessoas já acessaram" com o total real de vendas confirmadas */
    showBuyerCount: z.boolean().default(true),
    /** só mostra o contador a partir deste número de compradores */
    minBuyers: z.number().int().min(1).max(100000).default(10),
    buyerLabel: z.string().max(120).default("pessoas já acessaram"),
  }),
  z.object({
    ...blockBase,
    type: z.literal("offerCard"),
    title: shortText.default("Seu acesso"),
    /** vazio = lista automática (produto + bônus da oferta) */
    items: z.array(z.string().max(200)).max(20).default([]),
    buttonLabel: z.string().max(60).default(""),
    note: z.string().max(300).default(""),
  }),
  z.object({
    ...blockBase,
    type: z.literal("ctaSection"),
    headline: shortText.default(""),
    subheadline: z.string().max(1000).default(""),
    buttonLabel: z.string().max(60).default(""),
    ctaAction,
  }),
  z.object({ ...blockBase, type: z.literal("bonuses"), title: shortText.default("Bônus incluídos"), useOffer: z.boolean().default(true) }),
  z.object({
    ...blockBase,
    type: z.literal("testimonials"),
    title: shortText.default("O que dizem os alunos"),
    items: z.array(z.object({ name: shortText, role: z.string().max(120).default(""), text: z.string().max(1000), avatarUrl: url.default("") })).max(30).default([]),
  }),
  z.object({ ...blockBase, type: z.literal("faq"), title: shortText.default("Perguntas frequentes"), items: z.array(z.object({ question: shortText, answer: z.string().max(2000) })).max(30).default([]) }),
  z.object({ ...blockBase, type: z.literal("price"), title: shortText.default("") }),
  z.object({ ...blockBase, type: z.literal("cta"), label: z.string().max(60).default(""), note: z.string().max(200).default("") }),
  z.object({ ...blockBase, type: z.literal("guarantee"), title: shortText.default("Garantia"), text: z.string().max(1000).default("") }),
  z.object({ ...blockBase, type: z.literal("footer"), text: z.string().max(1000).default("") }),
]);
export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];

export const brandSchema = z.object({
  name: z.string().max(80).default(""),
  tagline: z.string().max(200).default(""),
  logoUrl: url.default(""),
});
export type Brand = z.infer<typeof brandSchema>;

export const salesPageSchema = z.object({
  theme: themeSchema.default(themeSchema.parse({})),
  brand: brandSchema.default(brandSchema.parse({})),
  /** objetos flutuantes, fundo líquido e movimento ao rolar (respeita "reduzir movimento" do aparelho) */
  effects: z.boolean().default(true),
  blocks: z.array(blockSchema).max(80).default([]),
});
export type SalesPage = z.infer<typeof salesPageSchema>;

// ---------- Leads / rastreamento ----------

export const leadCaptureSchema = z.object({
  mode: z.enum(["off", "before_result", "after_result"]).default("off"),
  required: z.boolean().default(false),
  /** obrigatório explicar o motivo quando required = true */
  requiredReason: z.string().max(300).default(""),
  askName: z.boolean().default(true),
  title: shortText.default("Quer receber seu resultado por e-mail?"),
  description: z.string().max(500).default(""),
  consentText: z
    .string()
    .max(1000)
    .default("Concordo em receber comunicações sobre este conteúdo e autorizo o uso do meu nome e e-mail para esse fim."),
});
export type LeadCapture = z.infer<typeof leadCaptureSchema>;

export const trackingSchema = z.object({
  metaPixelId: z.string().regex(/^\d{0,20}$/, "Pixel ID deve conter apenas números").default(""),
  gaMeasurementId: z.string().regex(/^(G-[A-Z0-9]{4,16})?$/, "Formato esperado: G-XXXXXXX").default(""),
  gtmId: z.string().regex(/^(GTM-[A-Z0-9]{4,12})?$/, "Formato esperado: GTM-XXXXXX").default(""),
});
export type Tracking = z.infer<typeof trackingSchema>;

// ---------- Documento completo ----------

export const campaignConfigSchema = z.object({
  version: z.literal(1).default(1),
  theme: themeSchema.default(themeSchema.parse({})),
  quiz: quizSchema.default(quizSchema.parse({})),
  profiles: z.array(profileSchema).max(50).default([]),
  rules: z.array(ruleSchema).max(100).default([]),
  offer: offerSchema.default(offerSchema.parse({})),
  salesPage: salesPageSchema.default(salesPageSchema.parse({})),
  leadCapture: leadCaptureSchema.default(leadCaptureSchema.parse({})),
  tracking: trackingSchema.default(trackingSchema.parse({})),
});
export type CampaignConfig = z.infer<typeof campaignConfigSchema>;

export function emptyConfig(): CampaignConfig {
  return campaignConfigSchema.parse({});
}

/** Lê configuração do banco tolerando documentos antigos/parciais. */
export function parseConfig(raw: unknown): CampaignConfig {
  const parsed = campaignConfigSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : emptyConfig();
}

/** Verificações de publicação além da validação estrutural. */
export function publishIssues(config: CampaignConfig): string[] {
  const issues: string[] = [];
  const qs = config.quiz.questions;
  if (qs.length === 0) issues.push("O quiz precisa de pelo menos uma pergunta.");
  for (const q of qs) {
    if ((q.type === "single" || q.type === "multiple") && q.options.length < 2)
      issues.push(`A pergunta "${q.title}" precisa de pelo menos duas opções.`);
    if (q.type === "range" && q.min >= q.max) issues.push(`A pergunta "${q.title}" tem faixa inválida (mínimo ≥ máximo).`);
  }
  if (config.profiles.length === 0) issues.push("Crie pelo menos um perfil de resultado.");
  if (config.profiles.length > 0 && !config.profiles.some((p) => p.isDefault))
    issues.push("Marque um perfil como resultado padrão (exibido quando nenhuma regra for atendida).");
  const profileIds = new Set(config.profiles.map((p) => p.id));
  for (const r of config.rules) {
    if (!profileIds.has(r.profileId)) issues.push(`A regra "${r.name || r.id}" aponta para um perfil inexistente.`);
  }
  if (!config.offer.checkoutUrl) issues.push("Informe a URL de checkout da oferta.");
  if (config.offer.referencePriceCents != null) {
    if (config.offer.referencePriceCents <= config.offer.priceCents)
      issues.push("O preço de referência deve ser maior que o preço atual (ou remova-o).");
    if (!config.offer.referencePriceNote.trim())
      issues.push("Explique a origem do preço de referência (ex.: preço praticado antes de DD/MM).");
  }
  if (config.leadCapture.mode !== "off" && config.leadCapture.required && !config.leadCapture.requiredReason.trim())
    issues.push("Captura de lead obrigatória exige uma justificativa registrada.");
  // campos de imagem com link de checkout/página aparecem como imagem quebrada
  const checkout = config.offer.checkoutUrl;
  const images: [string, string][] = [
    ["Capa do produto", config.offer.coverImageUrl],
    ["Logo da marca", config.salesPage.brand.logoUrl],
    ["Imagem da introdução do quiz", config.quiz.intro.imageUrl],
    ...config.offer.bonuses.map((x, i): [string, string] => [`Capa do bônus ${i + 1}`, x.imageUrl]),
    ...config.quiz.questions.map((q): [string, string] => [`Imagem da pergunta "${q.title}"`, q.imageUrl]),
    ...config.profiles.map((p): [string, string] => [`Imagem do perfil "${p.name}"`, p.imageUrl]),
    ...config.salesPage.blocks.flatMap((bl): [string, string][] =>
      bl.type === "hero" ? [["Imagem do bloco de topo", bl.imageUrl]] : bl.type === "image" || bl.type === "mockup" ? [[`Imagem do bloco "${bl.type}"`, bl.url]] : [],
    ),
  ];
  for (const [label, url] of images) {
    const problem = imageUrlProblem(url, checkout);
    if (problem) issues.push(`${label}: o link ${problem}. Use o endereço direto de uma imagem ou deixe o campo vazio.`);
  }
  return issues;
}

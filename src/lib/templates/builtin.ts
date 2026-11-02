import type { Block, CampaignConfig, Condition, Profile, Question, QuestionType, Rule } from "@/lib/domain/config";
import { blockSchema, emptyConfig } from "@/lib/domain/config";

/**
 * Modelos embutidos. São apenas DADOS: o seed os grava na tabela `templates` e,
 * ao criar uma campanha a partir de um modelo, o documento é copiado para a campanha.
 * Nenhum renderizador conhece estes conteúdos.
 */

type Opt = [label: string, value: string, score?: number, attrs?: Record<string, string>];

function q(
  id: string,
  type: QuestionType,
  title: string,
  attributeKey: string,
  opts: Opt[] = [],
  extra: Partial<Question> = {},
): Question {
  const options =
    type === "yes_no" && opts.length === 0
      ? [
          { id: "yes", label: "Sim", value: "sim", score: 0, attributes: {}, tags: [] },
          { id: "no", label: "Não", value: "nao", score: 0, attributes: {}, tags: [] },
        ]
      : opts.map(([label, value, score = 0, attributes = {}], i) => ({
          id: type === "yes_no" ? (i === 0 ? "yes" : "no") : `${id}_${value}`,
          label,
          value,
          score,
          attributes,
          tags: [],
        }));
  return {
    id,
    type,
    title,
    description: "",
    imageUrl: "",
    required: true,
    attributeKey,
    options,
    maxSelections: 0,
    placeholder: "",
    min: 0,
    max: 100,
    step: 1,
    prefix: "",
    suffix: "",
    feedback: "",
    ...extra,
  };
}

type Cond = [source: Condition["source"], target: string, operator: Condition["operator"], value: string];

function rule(id: string, name: string, profileId: string, combinator: "and" | "or", conds: Cond[]): Rule {
  return {
    id,
    name,
    enabled: true,
    profileId,
    when: {
      kind: "group",
      id: `${id}_g`,
      combinator,
      children: conds.map(([source, target, operator, value], i) => ({
        kind: "condition" as const,
        id: `${id}_c${i}`,
        source,
        target,
        operator,
        value,
      })),
    },
  };
}

function profile(id: string, name: string, p: Partial<Profile>): Profile {
  return {
    id,
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
    isDefault: false,
    ...p,
  };
}

let n = 0;
/** Bloco validado pelo schema (padrões preenchidos automaticamente). */
const b = (type: Block["type"], props: Record<string, unknown> = {}): Block => blockSchema.parse({ id: `b${++n}`, type, ...props });

function salesBlocks(headline: string, sub: string, faq: [string, string][]): Block[] {
  return [
    b("headline", { text: headline, align: "center" }),
    b("subheadline", { text: sub, align: "center" }),
    b("benefits", { title: "O que você vai aprender", useOffer: true, items: [] }),
    b("bonuses", { title: "Bônus incluídos", useOffer: true }),
    b("price", { title: "Acesso completo" }),
    b("cta", { label: "", note: "Pagamento processado pela plataforma de checkout." }),
    b("guarantee", { title: "Garantia", text: "" }),
    b("faq", { title: "Perguntas frequentes", items: faq.map(([question, answer]) => ({ question, answer })) }),
    b("footer", { text: "Os resultados variam de pessoa para pessoa e dependem da aplicação de cada um." }),
  ];
}

function base(): CampaignConfig {
  return emptyConfig();
}

const disclaimer = "Este quiz é uma ferramenta de orientação. Não é um diagnóstico nem uma previsão de resultados.";

// ---------------------------------------------------------------------------

function rendaExtra(): CampaignConfig {
  const c = base();
  c.quiz.intro = {
    enabled: true,
    title: "Qual forma de renda extra combina com a sua rotina?",
    subtitle: "Responda 7 perguntas rápidas e veja um caminho alinhado ao seu tempo e ao seu orçamento.",
    imageUrl: "",
    ctaLabel: "Começar",
    disclaimer,
  };
  c.quiz.questions = [
    q("tempo", "single", "Quanto tempo por dia você teria disponível?", "tempo_disponivel", [
      ["Até 1 hora", "ate_1h"],
      ["De 1 a 3 horas", "1_3h"],
      ["Mais de 3 horas", "mais_3h"],
    ]),
    q("capital", "single", "Quanto você poderia investir para começar?", "capital_inicial", [
      ["Até R$ 50", "ate_50"],
      ["De R$ 50 a R$ 300", "50_300"],
      ["Mais de R$ 300", "mais_300"],
    ]),
    q("preferencia", "single", "O que você prefere fazer?", "preferencia", [
      ["Vender produtos", "vendas"],
      ["Prestar serviços", "servicos"],
      ["Criar conteúdo", "conteudo"],
    ]),
    q("objetivo", "single", "Quanto você gostaria de ganhar a mais por mês?", "objetivo_financeiro", [
      ["Até R$ 500", "ate_500"],
      ["R$ 500 a R$ 1.000", "500_1000"],
      ["R$ 1.000 a R$ 2.000", "1000_2000"],
      ["Mais de R$ 2.000", "mais_2000"],
    ]),
    q("experiencia", "yes_no", "Você já vendeu algo pela internet?", "ja_vendeu_online"),
    q(
      "canais",
      "multiple",
      "Onde você tem mais facilidade de falar com pessoas?",
      "canais",
      [
        ["WhatsApp", "whatsapp"],
        ["Instagram", "instagram"],
        ["Pessoalmente", "presencial"],
        ["Ainda não sei", "nao_sei"],
      ],
      { description: "Pode marcar mais de uma opção." },
    ),
    q("motivo", "text", "Em poucas palavras, por que você quer uma renda extra?", "motivo", [], {
      required: false,
      placeholder: "Ex.: quitar dívidas, juntar para uma viagem...",
    }),
  ];
  c.profiles = [
    profile("vendedor", "Vendedor de baixo investimento", {
      title: "Você pode começar sem montar um grande estoque.",
      subtitle: "Seu perfil combina com modelos de venda sob encomenda.",
      description:
        "Existem modelos comerciais em que você valida o interesse do comprador antes de adquirir mercadorias, reduzindo o risco de começar.",
      highlights: ["Pouco tempo disponível por dia", "Capital inicial reduzido", "Preferência por vendas"],
      recommendations: ["Comece por encomendas e pré-venda", "Use os contatos que você já tem no WhatsApp", "Reinvista os primeiros lucros"],
      ctaLabel: "Conheça o guia para começar",
    }),
    profile("servicos", "Prestador de serviços", {
      title: "Suas habilidades podem virar um serviço.",
      description: "Serviços costumam exigir pouco investimento inicial: o principal ativo é o seu tempo e o que você já sabe fazer.",
      highlights: ["Preferência por prestar serviços"],
      recommendations: ["Liste o que você já faz bem", "Defina um preço por entrega", "Peça indicações aos primeiros clientes"],
    }),
    profile("conteudo", "Criador de conteúdo", {
      title: "Você tem perfil para construir uma audiência.",
      description: "Conteúdo exige constância. Com mais tempo disponível, é possível testar formatos e entender o que seu público procura.",
      highlights: ["Preferência por criar conteúdo"],
      recommendations: ["Escolha um tema que você domina", "Publique com regularidade", "Monetize só depois de validar o interesse"],
    }),
    profile("explorador", "Explorador", {
      title: "Você está no momento de explorar possibilidades.",
      description: "Suas respostas mostram um perfil equilibrado. O primeiro passo é testar uma ideia pequena antes de se comprometer.",
      recommendations: ["Teste uma ideia em uma semana", "Anote o que funcionou", "Escolha um caminho e aprofunde"],
      isDefault: true,
    }),
  ];
  c.rules = [
    rule("r_vendedor", "Baixo investimento + vendas", "vendedor", "and", [
      ["attribute", "tempo_disponivel", "equals", "ate_1h"],
      ["attribute", "capital_inicial", "equals", "ate_50"],
      ["attribute", "preferencia", "equals", "vendas"],
    ]),
    rule("r_vendas", "Preferência por vendas", "vendedor", "and", [["attribute", "preferencia", "equals", "vendas"]]),
    rule("r_servicos", "Preferência por serviços", "servicos", "and", [["attribute", "preferencia", "equals", "servicos"]]),
    rule("r_conteudo", "Conteúdo com tempo disponível", "conteudo", "and", [
      ["attribute", "preferencia", "equals", "conteudo"],
      ["attribute", "tempo_disponivel", "not_equals", "ate_1h"],
    ]),
  ];
  c.leadCapture = { ...c.leadCapture, mode: "after_result", required: false };
  c.salesPage.blocks = salesBlocks("Comece sua renda extra com o que você já tem", "Um guia prático, passo a passo, para quem tem pouco tempo e pouco capital.", [
    ["Preciso de muito dinheiro para começar?", "Não. O conteúdo prioriza modelos que podem começar com pouco investimento."],
    ["Em quanto tempo terei resultados?", "Depende da sua dedicação e do seu contexto. Não fazemos promessas de ganhos."],
  ]);
  return c;
}

function descobertaPerfil(): CampaignConfig {
  const c = base();
  c.quiz.intro = { enabled: true, title: "Qual é o seu estilo de trabalho?", subtitle: "Descubra em 2 minutos como você costuma tomar decisões.", imageUrl: "", ctaLabel: "Descobrir", disclaimer };
  const scale: Opt[] = [
    ["Quase nunca", "1", 1],
    ["Às vezes", "2", 2],
    ["Frequentemente", "3", 3],
  ];
  c.quiz.questions = [
    q("p1", "single", "Você prefere planejar tudo antes de começar?", "planejamento", scale),
    q("p2", "single", "Você se sente confortável assumindo riscos?", "risco", scale),
    q("p3", "single", "Você gosta de liderar grupos?", "lideranca", scale),
    q("p4", "single", "Você aprende melhor colocando a mão na massa?", "pratica", scale),
    q("p5", "yes_no", "Você prefere trabalhar sozinho?", "trabalho_solo"),
  ];
  c.profiles = [
    profile("estrategista", "Estrategista", { title: "Você é um estrategista.", description: "Você pensa antes de agir e gosta de ter clareza sobre os próximos passos." }),
    profile("realizador", "Realizador", { title: "Você é um realizador.", description: "Você aprende fazendo e não tem medo de testar." }),
    profile("equilibrado", "Equilibrado", { title: "Você tem um perfil equilibrado.", description: "Você alterna entre planejar e executar conforme a situação.", isDefault: true }),
  ];
  c.rules = [
    rule("r_estr", "Pontuação alta + planejamento", "estrategista", "and", [
      ["score", "", "gte", "10"],
      ["attribute", "planejamento", "equals", "3"],
    ]),
    rule("r_real", "Prática e risco", "realizador", "and", [
      ["attribute", "pratica", "equals", "3"],
      ["attribute", "risco", "gte", "2"],
    ]),
  ];
  c.salesPage.blocks = salesBlocks("Use seu estilo a seu favor", "Um material para transformar seu perfil em decisões melhores.", []);
  return c;
}

function recomendacaoProduto(): CampaignConfig {
  const c = base();
  c.quiz.intro = { enabled: true, title: "Qual opção é ideal para você?", subtitle: "Responda e receba uma recomendação de acordo com sua necessidade.", imageUrl: "", ctaLabel: "Ver recomendação", disclaimer: "" };
  c.quiz.questions = [
    q("uso", "single", "Para que você vai usar?", "uso", [
      ["Uso pessoal", "pessoal"],
      ["Trabalho", "trabalho"],
      ["Presente", "presente"],
    ]),
    q("prioridade", "single", "O que é mais importante para você?", "prioridade", [
      ["Preço", "preco"],
      ["Qualidade", "qualidade"],
      ["Praticidade", "praticidade"],
    ]),
    q("orcamento", "range", "Qual é o seu orçamento?", "orcamento", [], { min: 50, max: 1000, step: 50, prefix: "R$ " }),
    q("nivel", "single", "Qual é a sua experiência com este tipo de produto?", "nivel", [
      ["Nenhuma", "iniciante"],
      ["Alguma", "intermediario"],
      ["Muita", "avancado"],
    ]),
  ];
  c.profiles = [
    profile("essencial", "Opção essencial", { title: "A opção essencial atende você.", description: "Foco no que importa, sem pagar por recursos que você não vai usar." }),
    profile("completa", "Opção completa", { title: "A opção completa é a mais indicada.", description: "Mais recursos para quem prioriza qualidade e usa com frequência." }),
    profile("padrao", "Recomendação geral", { title: "Separamos uma recomendação para você.", isDefault: true }),
  ];
  c.rules = [
    rule("r_ess", "Prioriza preço ou orçamento baixo", "essencial", "or", [
      ["attribute", "prioridade", "equals", "preco"],
      ["attribute", "orcamento", "lte", "200"],
    ]),
    rule("r_comp", "Qualidade com orçamento", "completa", "and", [
      ["attribute", "prioridade", "equals", "qualidade"],
      ["attribute", "orcamento", "gt", "200"],
    ]),
  ];
  c.salesPage.blocks = salesBlocks("A escolha certa para o seu momento", "Veja os detalhes da opção recomendada.", []);
  return c;
}

function qualificacaoClientes(): CampaignConfig {
  const c = base();
  c.quiz.intro = { enabled: true, title: "Vamos entender o seu projeto", subtitle: "Algumas perguntas para indicarmos o melhor próximo passo.", imageUrl: "", ctaLabel: "Começar", disclaimer: "" };
  c.quiz.questions = [
    q("tamanho", "single", "Qual é o tamanho da sua empresa?", "tamanho", [
      ["Só eu", "solo", 1],
      ["2 a 10 pessoas", "pequena", 2],
      ["Mais de 10 pessoas", "media", 3],
    ]),
    q("orcamento", "number", "Qual orçamento mensal você tem para este projeto (R$)?", "orcamento", [], { placeholder: "Ex.: 2000" }),
    q("urgencia", "range", "De 1 a 10, qual é a urgência?", "urgencia", [], { min: 1, max: 10, step: 1 }),
    q("decisor", "yes_no", "Você é quem decide a contratação?", "decisor", [
      ["Sim", "sim", 3],
      ["Não", "nao", 0],
    ]),
  ];
  c.profiles = [
    profile("qualificado", "Lead qualificado", { title: "Seu projeto tem tudo para avançar.", description: "Pelo que você respondeu, faz sentido conversarmos sobre os detalhes.", ctaLabel: "Agendar conversa" }),
    profile("nutrir", "Em amadurecimento", { title: "Seu projeto ainda está amadurecendo.", description: "Separamos um material para ajudar você a planejar os próximos passos.", isDefault: true }),
  ];
  c.rules = [
    rule("r_q", "Orçamento + decisor + urgência", "qualificado", "and", [
      ["attribute", "orcamento", "gte", "1000"],
      ["attribute", "decisor", "equals", "sim"],
      ["attribute", "urgencia", "gte", "6"],
    ]),
  ];
  c.leadCapture = { ...c.leadCapture, mode: "before_result", required: false, title: "Para onde enviamos a proposta?" };
  c.salesPage.blocks = salesBlocks("Vamos tirar seu projeto do papel", "Conheça como trabalhamos.", []);
  return c;
}

function empreendedorismo(): CampaignConfig {
  const c = base();
  c.quiz.intro = { enabled: true, title: "Em que fase está o seu negócio?", subtitle: "Identifique a sua fase e veja o que priorizar agora.", imageUrl: "", ctaLabel: "Começar", disclaimer };
  c.quiz.questions = [
    q("fase", "single", "Como você descreveria seu negócio hoje?", "fase", [
      ["Ainda é uma ideia", "ideia"],
      ["Já tenho os primeiros clientes", "validacao"],
      ["Vendo todo mês", "tracao"],
    ]),
    q("faturamento", "single", "Qual é o faturamento mensal aproximado?", "faturamento", [
      ["Ainda não faturo", "zero"],
      ["Até R$ 5 mil", "ate_5k"],
      ["Mais de R$ 5 mil", "mais_5k"],
    ]),
    q("desafio", "multiple", "Quais são seus maiores desafios?", "desafios", [
      ["Conseguir clientes", "clientes"],
      ["Organizar finanças", "financas"],
      ["Gestão do tempo", "tempo"],
      ["Precificação", "preco"],
    ]),
    q("formalizado", "yes_no", "Seu negócio é formalizado (MEI/CNPJ)?", "formalizado"),
  ];
  c.profiles = [
    profile("ideia", "Fase de ideia", { title: "Hora de validar sua ideia.", recommendations: ["Converse com 10 potenciais clientes", "Faça uma pré-venda simples"] }),
    profile("validacao", "Fase de validação", { title: "Você está validando seu negócio.", recommendations: ["Padronize sua oferta", "Organize o fluxo de caixa"] }),
    profile("tracao", "Fase de tração", { title: "Seu negócio está ganhando tração.", recommendations: ["Crie processos", "Meça seus custos de aquisição"] }),
    profile("geral", "Empreendedor", { title: "Vamos organizar seus próximos passos.", isDefault: true }),
  ];
  c.rules = [
    rule("r_i", "Ideia", "ideia", "and", [["attribute", "fase", "equals", "ideia"]]),
    rule("r_v", "Validação", "validacao", "and", [["attribute", "fase", "equals", "validacao"]]),
    rule("r_t", "Tração", "tracao", "or", [
      ["attribute", "fase", "equals", "tracao"],
      ["attribute", "faturamento", "equals", "mais_5k"],
    ]),
  ];
  c.salesPage.blocks = salesBlocks("O plano certo para a fase do seu negócio", "Conteúdo organizado por etapa, do primeiro cliente à estruturação.", []);
  return c;
}

function marketingDigital(): CampaignConfig {
  const c = base();
  c.quiz.intro = { enabled: true, title: "Qual é o seu nível em marketing digital?", subtitle: "Teste rápido para saber por onde continuar estudando.", imageUrl: "", ctaLabel: "Fazer o teste", disclaimer };
  c.quiz.questions = [
    q("m1", "single", "Você já criou um anúncio pago?", "anuncios", [
      ["Nunca", "nunca", 0],
      ["Algumas vezes", "algumas", 1],
      ["Faço com frequência", "frequente", 2],
    ]),
    q("m2", "single", "Você sabe o que é taxa de conversão?", "conversao", [
      ["Não", "nao", 0],
      ["Tenho uma ideia", "ideia", 1],
      ["Sei calcular e acompanho", "sim", 2],
    ]),
    q("m3", "single", "Você usa UTMs nos seus links?", "utm", [
      ["O que é UTM?", "nao", 0],
      ["Às vezes", "as_vezes", 1],
      ["Sempre", "sempre", 2],
    ]),
    q("m4", "multiple", "Quais canais você já usou?", "canais", [
      ["Instagram", "instagram", 1],
      ["Google Ads", "google", 1],
      ["E-mail marketing", "email", 1],
      ["Nenhum", "nenhum", 0],
    ]),
  ];
  c.profiles = [
    profile("iniciante", "Iniciante", { title: "Você está começando — e esse é o melhor momento para aprender a base.", isDefault: true }),
    profile("intermediario", "Intermediário", { title: "Você já tem a base. Agora é hora de medir melhor." }),
    profile("avancado", "Avançado", { title: "Você domina os fundamentos. Foco em otimização." }),
  ];
  c.rules = [
    rule("r_av", "Pontuação ≥ 7", "avancado", "and", [["score", "", "gte", "7"]]),
    rule("r_int", "Pontuação ≥ 3", "intermediario", "and", [["score", "", "gte", "3"]]),
  ];
  c.salesPage.blocks = salesBlocks("Marketing digital do jeito certo para o seu nível", "Trilhas de estudo separadas por nível de conhecimento.", []);
  return c;
}


// ---------------------------------------------------------------------------
// ROTA INVISÍVEL — quiz + página de vendas personalizada por perfil

/** Condição simples reutilizada nas interpretações do bloco personalizado. */
function when(id: string, conds: Cond[], combinator: "and" | "or" = "and") {
  return rule(id, "", "_", combinator, conds).when;
}

function rotaInvisivel(): CampaignConfig {
  const c = base();
  const dark = {
    background: "#0a0a0b",
    surface: "#141416",
    text: "#ffffff",
    muted: "#a1a1aa",
    accent: "#ff6b00",
    accentText: "#0a0a0b",
    font: "inter" as const,
    radius: 12,
    baseFontSize: 16,
    spacing: "normal" as const,
  };
  c.theme = { ...dark };
  c.quiz.intro = {
    enabled: true,
    title: "Qual caminho de renda extra combina com a sua realidade?",
    subtitle: "Responda 7 perguntas rápidas sobre seu tempo, seu orçamento e suas preferências.",
    imageUrl: "",
    ctaLabel: "Descobrir meu caminho",
    disclaimer: "Quiz de orientação. Não é diagnóstico nem promessa de ganhos.",
  };
  c.quiz.questions = [
    q("objetivo", "single", "Quanto você gostaria de ganhar a mais por mês?", "objetivo_financeiro", [
      ["Até R$ 500", "ate_500"],
      ["R$ 500 a R$ 1.000", "500_1000"],
      ["R$ 1.000 a R$ 2.000", "1000_2000"],
      ["Mais de R$ 2.000", "mais_2000"],
    ]),
    q("tempo", "single", "Quanto tempo por dia você teria disponível?", "tempo_disponivel", [
      ["Até 1 hora por dia", "ate_1h"],
      ["De 1 a 3 horas por dia", "1_3h"],
      ["Mais de 3 horas por dia", "mais_3h"],
    ]),
    q("capital", "single", "Quanto você poderia investir para começar?", "capital_inicial", [
      ["Até R$ 50", "ate_50"],
      ["De R$ 50 a R$ 300", "50_300"],
      ["Mais de R$ 300", "mais_300"],
    ]),
    q("preferencia", "single", "O que você prefere fazer?", "preferencia", [
      ["Vender produtos", "vendas"],
      ["Prestar serviços", "servicos"],
      ["Criar conteúdo na internet", "conteudo"],
      ["Ainda não sei", "indefinido"],
    ]),
    q("dificuldade", "single", "Qual é a sua principal dificuldade hoje?", "dificuldade", [
      ["Não sei por onde começar", "por_onde_comecar"],
      ["Tenho pouco tempo", "tempo"],
      ["Tenho pouco dinheiro", "dinheiro"],
      ["Já tentei e não deu certo", "ja_tentou"],
      ["Não sei como conseguir clientes", "clientes"],
    ]),
    q("onde", "single", "Onde você prefere atuar?", "onde_atuar", [
      ["Pela internet", "internet"],
      ["Fora da internet", "presencial"],
      ["Nos dois", "ambos"],
    ]),
    q("experiencia", "yes_no", "Você já vendeu algum produto ou serviço?", "ja_vendeu"),
  ];
  c.quiz.settings.transitionMessage = "Analisando suas respostas...";

  c.profiles = [
    profile("vendedor", "Vendedor de baixo investimento", {
      title: "Você pode começar a vender sem montar um grande estoque.",
      subtitle: "Seu perfil combina com modelos de venda que exigem pouco capital inicial.",
      description: "Existem formas de vender em que você valida o interesse do comprador antes de comprar mercadorias, o que reduz o risco de começar.",
      recommendations: ["Conheça vendas sob encomenda e revenda sem estoque", "Comece pelos contatos que você já tem", "Use estratégias simples para encontrar compradores"],
      ctaLabel: "Ver meu caminho",
    }),
    profile("servicos", "Prestador de serviços", {
      title: "O que você já sabe fazer pode virar um serviço.",
      subtitle: "Seu perfil combina com a monetização de habilidades.",
      description: "Serviços costumam exigir pouco investimento: o principal recurso é o seu conhecimento e o seu tempo.",
      recommendations: ["Liste as habilidades que você já tem", "Avalie serviços digitais e locais", "Aprenda a apresentar sua oferta para os primeiros clientes"],
      ctaLabel: "Ver meu caminho",
    }),
    profile("conteudo", "Criador de conteúdo", {
      title: "Conteúdo pode ser o começo de uma renda extra.",
      subtitle: "Seu perfil combina com criação de conteúdo e produtos digitais.",
      description: "Criar conteúdo exige constância. Entender as formas de monetização ajuda a escolher onde colocar sua energia.",
      recommendations: ["Escolha um tema que você domina", "Conheça as formas de monetização", "Pense em produtos digitais desde o início"],
      ctaLabel: "Ver meu caminho",
    }),
    profile("explorador", "Explorador", {
      title: "Seu momento é de conhecer as possibilidades.",
      subtitle: "Antes de escolher, vale comparar os caminhos.",
      description: "Suas respostas indicam que comparar modelos de renda, com critérios claros, é o melhor primeiro passo.",
      recommendations: ["Compare modelos de renda lado a lado", "Use critérios para avaliar cada oportunidade", "Escolha uma direção e teste em pequena escala"],
      ctaLabel: "Ver meu caminho",
      isDefault: true,
    }),
  ];
  c.rules = [
    rule("r_vendedor", "Prefere vender produtos", "vendedor", "and", [["attribute", "preferencia", "equals", "vendas"]]),
    rule("r_servicos", "Prefere prestar serviços", "servicos", "and", [["attribute", "preferencia", "equals", "servicos"]]),
    rule("r_conteudo", "Prefere criar conteúdo", "conteudo", "and", [["attribute", "preferencia", "equals", "conteudo"]]),
  ];

  c.offer = {
    ...c.offer,
    productName: "Rota Invisível",
    priceCents: 1990,
    paymentTerms: "Pagamento único",
    buttonLabel: "Quero acessar o Rota Invisível",
    checkoutUrl: "https://pay.kiwify.com.br/7fyz1pO",
    description: "Um guia prático com diferentes possibilidades de construir uma renda extra pela internet e fora dela.",
    benefits: [
      "O universo da renda extra",
      "Dinheiro pela internet",
      "Oportunidades fora da internet",
      "Começando com pouco",
      "Como encontrar clientes",
      "Ferramentas para começar",
      "Plano de execução",
    ],
    bonuses: [
      { title: "30 ideias de renda extra", description: "Uma seleção de possibilidades para explorar.", imageUrl: "" },
      { title: "Kit de ferramentas gratuitas", description: "Ferramentas que podem ajudar na criação, divulgação e comercialização.", imageUrl: "" },
      { title: "Guia para conseguir clientes", description: "Estratégias práticas para encontrar potenciais compradores.", imageUrl: "" },
      { title: "Plano de execução de 30 dias", description: "Um roteiro para organizar e executar as primeiras ações.", imageUrl: "" },
    ],
    guarantee: "", // preencha com a política real do produto
    guaranteeDays: null,
  };

  const P = { v: ["vendedor"], s: ["servicos"], c: ["conteudo"], e: ["explorador"] };
  const ctaLabel = "Quero descobrir meu caminho";
  c.salesPage = {
    theme: { ...dark },
    brand: { name: "Rota Invisível", tagline: "Encontre caminhos para ganhar dinheiro que você ainda não enxergou.", logoUrl: "" },
    effects: true,
    blocks: [
      // 1 — Hero (variações por perfil; sem perfil = versão geral)
      b("hero", {
        group: "hero",
        badge: "Produto digital",
        headline: "Você não precisa de mais dinheiro para começar. Precisa descobrir os caminhos que ainda não enxergou.",
        subheadline: "Descubra diferentes maneiras de construir uma renda extra, mesmo tendo pouco tempo, pouco dinheiro e nenhuma experiência. Um guia prático para encontrar oportunidades e começar com o que você já tem.",
        ctaLabel,
        ctaAction: "offer",
      }),
      b("hero", {
        group: "hero",
        profileIds: P.v,
        badge: "Produto digital",
        headline: "Você não precisa de estoque para começar a vender. Precisa descobrir os caminhos que ainda não enxergou.",
        subheadline: "Conheça modelos de venda sob encomenda, revenda sem estoque e estratégias para encontrar compradores — começando com o que você já tem.",
        ctaLabel,
        ctaAction: "offer",
      }),
      b("hero", {
        group: "hero",
        profileIds: P.s,
        badge: "Produto digital",
        headline: "O que você já sabe fazer pode ser o começo da sua renda extra.",
        subheadline: "Descubra como transformar habilidades em serviços digitais ou locais e como apresentar sua oferta para os primeiros clientes.",
        ctaLabel,
        ctaAction: "offer",
      }),
      b("hero", {
        group: "hero",
        profileIds: P.c,
        badge: "Produto digital",
        headline: "Conteúdo pode virar renda. O primeiro passo é enxergar os caminhos certos.",
        subheadline: "Entenda as formas de monetizar conteúdo, criar produtos digitais e construir audiência — com orientação prática para começar.",
        ctaLabel,
        ctaAction: "offer",
      }),

      // 2 — Resultado personalizado (respostas reais + interpretações por condição)
      b("personalized", {
        tone: "surface",
        eyebrow: "Analisamos suas respostas",
        title: "Seu próximo passo pode começar com aquilo que você já tem.",
        summary: [
          { id: "s_obj", label: "Objetivo financeiro", questionId: "objetivo" },
          { id: "s_tempo", label: "Tempo disponível", questionId: "tempo" },
          { id: "s_dif", label: "Principal dificuldade", questionId: "dificuldade" },
          { id: "s_pref", label: "Preferência de atividade", questionId: "preferencia" },
          { id: "s_cap", label: "Capital inicial", questionId: "capital" },
          { id: "s_onde", label: "Onde prefere atuar", questionId: "onde" },
        ],
        maxInsights: 4,
        insights: [
          { id: "i_vendas", title: "Vender sem montar estoque", text: "Como você prefere vender produtos, vale conhecer modelos de revenda, vendas sob encomenda e comercialização sem estoque — apresentados no guia.", when: when("i_vendas", [["attribute", "preferencia", "equals", "vendas"]]) },
          { id: "i_servicos", title: "Transformar habilidades em serviços", text: "Como você prefere prestar serviços, o guia mostra possibilidades de serviços digitais e locais e como apresentar o que você sabe fazer.", when: when("i_servicos", [["attribute", "preferencia", "equals", "servicos"]]) },
          { id: "i_conteudo", title: "Do conteúdo à monetização", text: "Como você prefere criar conteúdo, o guia apresenta formas de monetização, produtos digitais e estratégias de divulgação.", when: when("i_conteudo", [["attribute", "preferencia", "equals", "conteudo"]]) },
          { id: "i_indef", title: "Comparar antes de escolher", text: "Você ainda não definiu uma preferência. O guia compara diferentes modelos de renda e apresenta critérios para escolher um que faça sentido para você.", when: when("i_indef", [["attribute", "preferencia", "equals", "indefinido"]]) },
          { id: "i_comecar", title: "Um roteiro para o primeiro passo", text: "Você disse que não sabe por onde começar. O plano de execução organiza as primeiras ações ao longo de 30 dias.", when: when("i_comecar", [["attribute", "dificuldade", "equals", "por_onde_comecar"]]) },
          { id: "i_clientes", title: "Encontrar os primeiros clientes", text: "Sua principal dificuldade é conseguir clientes. Há um capítulo dedicado a divulgar serviços, apresentar ofertas e conquistar compradores.", when: when("i_clientes", [["attribute", "dificuldade", "equals", "clientes"]]) },
          { id: "i_tentou", title: "Escolher com critério", text: "Você já tentou antes. Conhecer o que cada caminho exige ajuda a escolher uma opção mais alinhada à sua realidade.", when: when("i_tentou", [["attribute", "dificuldade", "equals", "ja_tentou"]]) },
          { id: "i_baixo", title: "Começar com pouco investimento", text: "Você indicou até R$ 50 para começar. O guia reúne alternativas de baixo investimento inicial, para testar uma ideia sem comprometer seu orçamento.", when: when("i_baixo", [["attribute", "capital_inicial", "equals", "ate_50"]]) },
          { id: "i_medio", title: "Um orçamento pequeno já abre opções", text: "Com até R$ 300 para começar, é possível avaliar alternativas que pedem algum investimento, sempre testando antes de ampliar.", when: when("i_medio", [["attribute", "capital_inicial", "equals", "50_300"]]) },
          { id: "i_1h", title: "Atividades para períodos curtos", text: "Com até 1 hora por dia, faz sentido priorizar atividades que possam ser feitas em blocos curtos e organizadas ao longo da semana.", when: when("i_1h", [["attribute", "tempo_disponivel", "equals", "ate_1h"]]) },
          { id: "i_poucotempo", title: "Aproveitar bem o tempo disponível", text: "Pouco tempo foi a dificuldade que você apontou. O plano de execução ajuda a organizar ações pequenas e consistentes.", when: when("i_poucotempo", [["attribute", "dificuldade", "equals", "tempo"]]) },
        ],
        fallbackText: "Com base nas suas respostas, o primeiro passo é conhecer as possibilidades e escolher uma que faça sentido para a sua realidade.",
      }),

      // 3 — Problema (curto)
      b("text", {
        emphasis: "statement",
        title: "O problema não é falta de oportunidade. É falta de direção.",
        body: "Sem saber qual caminho escolher, é fácil perder tempo, abandonar ideias e continuar no mesmo lugar. O primeiro passo é conhecer as opções e escolher uma que caiba na sua realidade.",
      }),

      // 4 — Solução
      b("text", {
        tone: "surface",
        showMockup: true,
        eyebrow: "A solução",
        title: "Conheça o ROTA INVISÍVEL.",
        body: "Um mapa prático para encontrar oportunidades e começar com o que você já tem — não uma promessa de enriquecimento.",
        bullets: ["Renda pela internet e fora dela", "Opções de baixo investimento", "Como conseguir os primeiros clientes", "Plano de ação de 30 dias"],
      }),

      // 5 — Capítulos (resumido)
      b("content", {
        numbered: true,
        eyebrow: "O que você vai encontrar",
        title: "Do panorama ao plano de ação, em 7 capítulos.",
        items: [
          { title: "O universo da renda extra", description: "Os modelos de renda e como avaliá-los." },
          { title: "Dinheiro pela internet", description: "Serviços, vendas, afiliados e produtos digitais." },
          { title: "Oportunidades fora da internet", description: "Revendas, serviços e negócios locais." },
          { title: "Começando com pouco", description: "Alternativas de baixo investimento inicial." },
          { title: "Como encontrar clientes", description: "Divulgar, apresentar ofertas e vender." },
          { title: "Ferramentas para começar", description: "Recursos gratuitos que ajudam desde o início." },
          { title: "Plano de execução", description: "Uma oportunidade em prática em 30 dias." },
        ],
      }),

      // 6 — Bônus (exibe apenas os bônus cadastrados na oferta)
      b("bonuses", { tone: "surface", title: "E ainda tem mais..." }),

      // 7 — Avaliações reais de compradores (oculto até haver avaliações aprovadas)
      b("reviews", { title: "Quem comprou, avalia" }),

      // 8 — Oferta
      b("offerCard", { title: "Seu acesso ao ROTA INVISÍVEL", buttonLabel: "Quero acessar o Rota Invisível", note: "Pagamento processado com segurança pela plataforma de checkout." }),

      // 9 — FAQ (essencial)
      b("faq", {
        tone: "surface",
        title: "Perguntas frequentes",
        items: [
          { question: "Preciso ter experiência para começar?", answer: "Não. O guia parte do básico e explica o que cada caminho exige, para você avaliar o que faz sentido para a sua realidade." },
          { question: "Preciso investir muito dinheiro?", answer: "Não. Há um capítulo dedicado a alternativas de baixo investimento inicial. Quando uma opção exige investimento, o guia deixa isso claro." },
          { question: "Vou ganhar dinheiro imediatamente?", answer: "Não há garantia de resultados financeiros. O guia apresenta possibilidades e um plano de execução; os resultados dependem da sua dedicação e do seu contexto." },
          { question: "Como receberei o material?", answer: "É um guia digital. Após a confirmação do pagamento, a plataforma de checkout envia as instruções de acesso para o e-mail informado na compra." },
        ],
      }),

      // 10 — CTA final
      b("ctaSection", {
        headline: "Você pode continuar procurando respostas ou começar a explorar novos caminhos.",
        subheadline: "Conheça as possibilidades, escolha uma direção e dê o primeiro passo.",
        buttonLabel: ctaLabel,
        ctaAction: "checkout",
      }),

      // 12 — Rodapé (responsável, privacidade e termos vêm das Configurações)
      b("footer", {
        text: "Resultados financeiros não são garantidos e dependem de fatores individuais, como dedicação, contexto e aplicação. Este é um produto educativo e não constitui promessa de ganhos.",
      }),
    ],
  };
  return c;
}

export const builtinTemplates: { key: string; name: string; description: string; category: string; config: CampaignConfig }[] = [
  {
    key: "rota-invisivel",
    name: "Rota Invisível — quiz + página de vendas",
    description: "Funil completo do guia Rota Invisível: 7 perguntas, 4 perfis e página de vendas personalizada pelas respostas.",
    category: "Renda extra",
    config: rotaInvisivel(),
  },
  { key: "renda-extra", name: "Quiz de renda extra", description: "7 perguntas sobre tempo, capital e preferência. 4 perfis.", category: "Renda extra", config: rendaExtra() },
  { key: "descoberta-perfil", name: "Quiz de descoberta de perfil", description: "Perfil comportamental por pontuação.", category: "Perfil", config: descobertaPerfil() },
  { key: "recomendacao-produto", name: "Quiz de recomendação de produto", description: "Recomenda a opção ideal por prioridade e orçamento.", category: "Produto", config: recomendacaoProduto() },
  { key: "qualificacao-clientes", name: "Quiz de qualificação de clientes", description: "Qualifica leads por orçamento, urgência e poder de decisão.", category: "B2B", config: qualificacaoClientes() },
  { key: "empreendedorismo", name: "Quiz de empreendedorismo", description: "Identifica a fase do negócio.", category: "Negócios", config: empreendedorismo() },
  { key: "marketing-digital", name: "Quiz de marketing digital", description: "Nível de conhecimento por pontuação.", category: "Marketing", config: marketingDigital() },
];

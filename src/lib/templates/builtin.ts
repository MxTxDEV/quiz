import type { Block, CampaignConfig, Condition, Profile, Question, QuestionType, Rule } from "@/lib/domain/config";
import { blockSchema, emptyConfig } from "@/lib/domain/config";

/**
 * Modelos embutidos. São apenas DADOS: o seed os grava na tabela `templates` e,
 * ao criar uma campanha a partir de um modelo, o documento é copiado para a campanha.
 * Nenhum renderizador conhece estes conteúdos.
 */

type Opt = [label: string, value: string, score?: number, attrs?: Record<string, string>, points?: Record<string, number>];

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
          { id: "yes", label: "Sim", value: "sim", score: 0, attributes: {}, tags: [], points: {} },
          { id: "no", label: "Não", value: "nao", score: 0, attributes: {}, tags: [], points: {} },
        ]
      : opts.map(([label, value, score = 0, attributes = {}, points = {}], i) => ({
          id: type === "yes_no" ? (i === 0 ? "yes" : "no") : `${id}_${value}`,
          label,
          value,
          score,
          attributes,
          tags: [],
          points,
        }));
  return {
    id,
    type,
    title,
    description: "",
    imageUrl: "",
    required: true,
    stage: "",
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
    paths: [],
    firstStep: "",
    ...p,
  } as Profile;
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

  // ---------------- Abertura e perguntas (Genéricas → Dor → Desejo → Solução) ----------------
  c.quiz.intro = {
    enabled: true,
    title: "Você quer ganhar dinheiro extra, mas ainda não sabe por onde começar?",
    subtitle: "Descubra oportunidades que podem combinar com sua realidade, seus objetivos e o tempo que você tem disponível.",
    imageUrl: "",
    ctaLabel: "Descobrir meu caminho",
    disclaimer: "Quiz de orientação. Não é diagnóstico nem promessa de ganhos.",
  };
  const E1 = "Etapa 1 de 4 — Conhecendo você";
  const E2 = "Etapa 2 de 4 — Entendendo sua realidade";
  const E3 = "Etapa 3 de 4 — Seus objetivos";
  const E4 = "Etapa 4 de 4 — Encontrando seu caminho";
  // pontos por perfil: iniciante · internet · vendas · servicos · pouco_tempo · direcao
  c.quiz.questions = [
    q("situacao", "single", "Como está sua situação financeira atualmente?", "situacao_financeira", [
      ["Estou tranquilo, mas gostaria de ganhar mais.", "tranquilo", 0, {}, {}],
      ["Consigo pagar minhas contas, mas sobra pouco.", "sobra_pouco", 0, {}, { iniciante: 1 }],
      ["Meu dinheiro acaba antes do fim do mês.", "acaba_antes", 0, {}, { iniciante: 2 }],
      ["Preciso encontrar uma nova fonte de renda.", "nova_fonte", 0, {}, { iniciante: 1, servicos: 1, vendas: 1 }],
    ], { stage: E1 }),
    q("dificuldade", "single", "Qual é sua maior dificuldade quando pensa em ganhar dinheiro extra?", "dificuldade", [
      ["Não sei por onde começar.", "por_onde_comecar", 0, {}, { direcao: 2, iniciante: 1 }],
      ["Não tenho dinheiro para investir.", "sem_dinheiro", 0, {}, { iniciante: 3 }],
      ["Não tenho tempo disponível.", "sem_tempo", 0, {}, { pouco_tempo: 3 }],
      ["Já tentei algumas coisas, mas não consegui.", "ja_tentou", 0, {}, { direcao: 1 }],
      ["Não sei como encontrar clientes.", "clientes", 0, {}, { servicos: 1, vendas: 1 }],
    ], { stage: E2 }),
    q("dor", "single", "O que mais incomoda você nessa situação?", "dor", [
      ["Depender exclusivamente do meu salário.", "depender_salario", 0, {}, { internet: 1 }],
      ["Não conseguir realizar meus planos.", "planos", 0, {}, {}],
      ["Trabalhar muito e continuar sem dinheiro.", "trabalho_muito", 0, {}, { pouco_tempo: 1 }],
      ["Não ter liberdade financeira.", "liberdade", 0, {}, { internet: 1 }],
      ["Sentir que estou parado enquanto poderia evoluir.", "parado", 0, {}, { direcao: 1 }],
    ], { stage: E2 }),
    q("objetivo", "single", "Quanto de renda extra faria diferença na sua vida hoje?", "objetivo_financeiro", [
      ["Até R$ 500 por mês.", "ate_500"],
      ["De R$ 500 a R$ 1.000.", "500_1000"],
      ["De R$ 1.000 a R$ 2.000.", "1000_2000"],
      ["Mais de R$ 2.000.", "mais_2000"],
    ], { stage: E3 }),
    q("conquista", "single", "O que você gostaria de conquistar tendo essa renda extra?", "conquista", [
      ["Ter mais tranquilidade financeira.", "tranquilidade", 0, {}, {}],
      ["Quitar minhas dívidas.", "dividas", 0, {}, { iniciante: 1 }],
      ["Ter dinheiro para realizar meus planos.", "planos", 0, {}, {}],
      ["Construir uma segunda fonte de renda.", "segunda_fonte", 0, {}, {}],
      ["Ter mais liberdade para escolher como viver.", "liberdade", 0, {}, { internet: 1 }],
    ], { stage: E3 }),
    q("preferencia", "single", "Qual dessas alternativas você estaria mais disposto a experimentar?", "preferencia", [
      ["Vender produtos sem precisar manter estoque.", "vendas", 0, {}, { vendas: 5 }],
      ["Prestar serviços.", "servicos", 0, {}, { servicos: 5 }],
      ["Trabalhar pela internet.", "internet", 0, {}, { internet: 5 }],
      ["Criar conteúdo ou trabalhar com divulgação.", "conteudo", 0, {}, { internet: 5 }],
      ["Ainda não sei. Preciso de orientação.", "indefinido", 0, {}, { direcao: 4, iniciante: 1 }],
    ], { stage: E4 }),
    q("tempo", "single", "Quanto tempo você conseguiria dedicar por dia para começar?", "tempo_disponivel", [
      ["Até 1 hora.", "ate_1h", 0, {}, { pouco_tempo: 6 }],
      ["De 1 a 3 horas.", "1_3h", 0, {}, {}],
      ["Mais de 3 horas.", "mais_3h", 0, {}, { servicos: 1, vendas: 1 }],
    ], { stage: E4 }),
  ];
  c.quiz.settings.transitionMessage = "Analisando suas respostas...";
  c.quiz.settings.transitionSteps = ["Analisando suas respostas...", "Identificando oportunidades compatíveis com seu perfil...", "Preparando sua recomendação..."];
  // classificação por pontos; empate → restrições primeiro (tempo, dinheiro), depois preferência, por último orientação ampla
  c.scoring = { mode: "points", tieBreak: ["pouco_tempo", "iniciante", "servicos", "vendas", "internet", "direcao"] };

  // ---------------- Página de resultado ----------------
  const fact = (id: string, text: string, key: string, ...values: string[]) => ({
    id,
    text,
    when: when(id, values.map((v) => ["attribute", key, "equals", v] as Cond), "or"),
  });
  c.quiz.result = {
    eyebrow: "Análise concluída",
    headline: "Encontramos caminhos que podem combinar com sua realidade.",
    realityTitle: "Sua realidade",
    maxReality: 4,
    // resumo: situação · dificuldade · preferência · tempo
    reality: [
      fact("re_s1", "Você está tranquilo, mas quer ganhar mais.", "situacao_financeira", "tranquilo"),
      fact("re_s2", "Você paga as contas, mas sobra pouco no fim do mês.", "situacao_financeira", "sobra_pouco"),
      fact("re_s3", "Seu dinheiro acaba antes do fim do mês.", "situacao_financeira", "acaba_antes"),
      fact("re_s4", "Você precisa de uma nova fonte de renda.", "situacao_financeira", "nova_fonte"),
      fact("re_d1", "Tem dificuldade para saber por onde começar.", "dificuldade", "por_onde_comecar"),
      fact("re_d2", "Não tem dinheiro para investir agora.", "dificuldade", "sem_dinheiro"),
      fact("re_d3", "Tem pouco tempo disponível.", "dificuldade", "sem_tempo"),
      fact("re_d4", "Já tentou algumas coisas, mas não deu certo.", "dificuldade", "ja_tentou"),
      fact("re_d5", "Não sabe como encontrar clientes.", "dificuldade", "clientes"),
      fact("re_p1", "Está disposto a vender produtos sem manter estoque.", "preferencia", "vendas"),
      fact("re_p2", "Prefere prestar serviços.", "preferencia", "servicos"),
      fact("re_p3", "Prefere trabalhar pela internet.", "preferencia", "internet"),
      fact("re_p4", "Prefere criar conteúdo ou trabalhar com divulgação.", "preferencia", "conteudo"),
      fact("re_p5", "Ainda precisa de orientação para escolher.", "preferencia", "indefinido"),
      fact("re_t1", "Tem até 1 hora por dia.", "tempo_disponivel", "ate_1h"),
      fact("re_t2", "Tem de 1 a 3 horas por dia.", "tempo_disponivel", "1_3h"),
      fact("re_t3", "Tem mais de 3 horas por dia.", "tempo_disponivel", "mais_3h"),
    ],
    reasonsTitle: "Por que esse caminho?",
    maxReasons: 3,
    // relação respostas → recomendação (ordem = prioridade)
    reasons: [
      fact("rz_tentou", "Como você já tentou antes, o foco aqui é estruturar a execução e conseguir os primeiros clientes — os dois pontos onde a maioria trava.", "dificuldade", "ja_tentou"),
      fact("rz_dinheiro", "Você indicou que não tem dinheiro para investir: nenhum caminho abaixo depende de estoque ou de compra antecipada.", "dificuldade", "sem_dinheiro"),
      { id: "rz_tempo", text: "Com pouco tempo, priorizamos atividades que cabem em blocos de 30 a 60 minutos e não dependem de horário fixo.", when: when("rz_tempo", [["attribute", "dificuldade", "equals", "sem_tempo"], ["attribute", "tempo_disponivel", "equals", "ate_1h"]], "or") },
      fact("rz_clientes", "Encontrar clientes é sua maior trava — cada caminho mostra onde estão os primeiros compradores.", "dificuldade", "clientes"),
      fact("rz_comecar", "Como você não sabe por onde começar, cada caminho termina com um primeiro passo simples para fazer hoje.", "dificuldade", "por_onde_comecar"),
      fact("rz_dividas", "Como seu objetivo é quitar dívidas, faz sentido começar sem gastar e direcionar o que entrar para as contas.", "conquista", "dividas"),
      fact("rz_meta_baixa", "Sua meta é um bom primeiro objetivo para testar uma atividade sem largar sua rotina.", "objetivo_financeiro", "ate_500", "500_1000"),
      fact("rz_meta_media", "Uma renda de R$ 1.000 a R$ 2.000 costuma vir de uma atividade mantida com constância — por isso o foco é escolher um caminho e sustentá-lo.", "objetivo_financeiro", "1000_2000"),
      fact("rz_meta_alta", "Para passar de R$ 2.000 por mês, o caminho realista é começar pequeno, validar e ampliar aos poucos — sem promessas de atalho.", "objetivo_financeiro", "mais_2000"),
      fact("rz_segunda", "Para construir uma segunda fonte de renda, o importante é escolher algo que você consiga manter ao lado da sua rotina.", "conquista", "segunda_fonte"),
      { id: "rz_geral", text: "Os caminhos respeitam a alternativa que você está disposto a experimentar e o tempo que tem por dia.", when: when("rz_geral", [["attribute", "preferencia", "answered", ""]]) },
    ],
    pathsTitle: "Oportunidades recomendadas para você",
    firstStepTitle: "Seu primeiro passo (dá para fazer hoje)",
    transitionTitle: "Você já identificou uma direção. Agora precisa saber como transformar isso em ação.",
    transitionText: "O ROTA INVISÍVEL reúne oportunidades, métodos, ferramentas e orientações práticas para ajudar você a sair da dúvida e organizar seus próximos passos.",
  };

  const path = (title: string, how: string, needs: string, challenge: string, firstStep: string) => ({ title, how, needs, challenge, firstStep });
  const cta = "Quero conhecer o Rota Invisível";
  c.profiles = [
    profile("iniciante", "Iniciante com pouco investimento", {
      title: "Comece por modelos que não exigem estoque nem dinheiro adiantado.",
      subtitle: "Pelas suas respostas, o mais seguro agora é começar com o que você já tem: validar a ideia primeiro e só investir depois que ela der sinal.",
      paths: [
        path("Um serviço com o que você já sabe fazer", "Você transforma uma habilidade que já tem — organizar, ensinar, consertar, cuidar — em um serviço simples, com horário combinado.", "R$ 0 — sua habilidade e algumas horas por semana.", "Enxergar o que você sabe como algo que alguém pagaria.", "Liste 5 habilidades e marque a que mais pessoas pediriam."),
        path("Desapego do que você não usa", "Você vende itens parados em marketplaces e grupos, e aprende na prática a anunciar e negociar.", "R$ 0 — só os itens e boas fotos.", "Fotos e descrições que chamem atenção.", "Separe 10 itens e anuncie hoje."),
        path("Artes simples no Canva", "Você cria cardápios, convites e posts para pessoas e comércios próximos, em cerca de 30 minutos por arte.", "R$ 0 — celular e o Canva gratuito.", "Mostrar exemplos para conseguir o primeiro pedido.", "Monte um cardápio de exemplo e ofereça a 3 estabelecimentos."),
      ],
      firstStep: "Faça um inventário rápido: o que você sabe fazer, quantas horas tem por semana e 10 pessoas que você poderia avisar. Com isso dá para escolher uma ideia de custo zero.",
      ctaLabel: cta,
    }),
    profile("internet", "Renda pela internet", {
      title: "Você pode começar pela internet com celular e ferramentas gratuitas.",
      subtitle: "Você prefere a internet. Os caminhos abaixo começam sem investimento e podem ser feitos nos horários que você tiver — o que muda é a constância.",
      paths: [
        path("Serviços digitais para pequenos negócios", "Social media, artes e edição de vídeos curtos para comércios e profissionais, entregues on-line.", "R$ 0 — celular ou computador e ferramentas gratuitas (Canva, CapCut).", "Montar um portfólio antes do primeiro cliente.", "Produza 3 exemplos e mostre a um negócio que você conhece."),
        path("Conteúdo + afiliados", "Você publica conteúdos úteis sobre um tema e indica produtos relacionados com link de afiliado.", "R$ 0 — celular e um tema que você domina.", "Manter a constância nas primeiras semanas.", "Publique 3 conteúdos curtos sobre um tema e indique 1 produto que usa."),
        path("Vídeos UGC para marcas", "Você grava vídeos naturais mostrando produtos para marcas usarem em anúncios.", "R$ 0 — celular e boa iluminação.", "Montar um portfólio inicial.", "Grave 2 vídeos de exemplo com produtos que você tem em casa."),
      ],
      firstStep: "Escolha um caminho e crie 3 exemplos com ferramentas gratuitas ainda esta semana. Ter algo para mostrar vale mais que qualquer currículo na hora de conseguir o primeiro cliente.",
      ctaLabel: cta,
    }),
    profile("vendas", "Perfil comercial e de vendas", {
      title: "Você pode vender sem montar estoque.",
      subtitle: "Você está disposto a vender. Para não arriscar dinheiro, os caminhos priorizam vender antes de comprar: encomenda, desapego e indicação de produtos de outras empresas.",
      paths: [
        path("Venda sob encomenda", "Você mostra o produto, recebe o pedido (de preferência com sinal) e só depois produz ou compra.", "R$ 0 a R$ 50 — fotos dos produtos e um catálogo simples.", "Cumprir prazos de entrega.", "Monte um catálogo com 3 produtos e publique no seu status."),
        path("Desapego e brechó on-line", "Você vende itens parados da sua casa ou peças garimpadas em marketplaces e grupos.", "R$ 0 — só os itens e boas fotos.", "Caprichar nas fotos, na descrição e no preço.", "Separe 10 itens que você não usa e anuncie hoje."),
        path("Afiliado de produtos", "Você recomenda produtos de outras empresas e recebe uma comissão por venda feita pelo seu link.", "R$ 0 — celular e um canal: status, grupo ou perfil.", "Ganhar confiança sem virar spam.", "Escolha 1 produto que você usa e explique por que recomenda."),
      ],
      firstStep: "Separe 10 itens que você não usa e anuncie em um marketplace hoje. É o jeito mais rápido de treinar foto, descrição, preço e negociação sem gastar nada.",
      ctaLabel: cta,
    }),
    profile("servicos", "Prestação de serviços", {
      title: "O que você já sabe fazer pode virar um serviço.",
      subtitle: "Serviços quase não pedem investimento: o principal recurso é o que você já sabe fazer. Escolhemos opções que você encaixa em horários definidos por você.",
      paths: [
        path("Serviços digitais por entrega", "Artes, cardápios, edição de vídeos curtos ou currículos — cada entrega leva de 30 a 60 minutos.", "R$ 0 — celular ou computador e ferramentas gratuitas.", "Mostrar exemplos antes de ter clientes.", "Faça 3 exemplos e ofereça a pessoas e negócios que você conhece."),
        path("Serviços locais com hora marcada", "Passeio com pets, aulas de reforço ou pequenos reparos, em horários que você define.", "R$ 0 — algo que você já faz bem.", "Conquistar a confiança dos primeiros clientes.", "Ofereça preço de lançamento a 3 conhecidos e peça uma avaliação."),
        path("Assistente virtual", "Você cuida de agenda, planilhas e atendimento para autônomos e pequenas empresas, em pacotes de horas.", "R$ 0 — organização e acesso à internet.", "Definir um pacote e um preço justo.", "Liste 5 tarefas que você sabe fazer e ofereça um pacote de horas."),
      ],
      firstStep: "Liste 5 coisas que você faz bem e que alguém pagaria para não ter que fazer. Escolha a que dá para começar ainda nesta semana.",
      ctaLabel: cta,
    }),
    profile("pouco_tempo", "Pouco tempo disponível", {
      title: "Comece com atividades que cabem em blocos curtos.",
      subtitle: "Com pouco tempo por dia, o segredo é escolher algo que funcione em 30 a 60 minutos e não dependa de horário fixo. Os caminhos abaixo foram escolhidos por isso.",
      paths: [
        path("Serviço por entrega (30 a 60 min)", "Artes no Canva, edição de vídeos curtos ou currículos: você faz cada pedido quando tiver um tempo livre.", "R$ 0 — celular e ferramentas gratuitas.", "Combinar prazos que caibam na sua rotina.", "Faça 1 exemplo hoje em 30 minutos e mostre a alguém."),
        path("Desapego em etapas", "Uma sessão para fotografar e anunciar; depois, alguns minutos por dia respondendo interessados.", "R$ 0 — itens parados e boas fotos.", "Responder rápido para não perder a venda.", "Separe 5 itens hoje e fotografe com luz natural."),
        path("Indicação de produtos (afiliados)", "Você indica produtos que conhece pelo status ou em grupos, em poucos minutos por dia.", "R$ 0 — celular e um canal para divulgar.", "Constância sem virar spam.", "Escolha 1 produto que você usa e publique uma indicação sincera."),
      ],
      firstStep: "Reserve um bloco fixo de 30 minutos na sua semana e use o primeiro para escolher um dos caminhos acima. Pouco tempo com constância rende mais do que muito tempo de vez em quando.",
      ctaLabel: cta,
    }),
    profile("direcao", "Encontrando sua direção", {
      title: "Seu momento é de comparar caminhos e testar o primeiro em pequena escala.",
      subtitle: "Você ainda está escolhendo — e isso é um bom ponto de partida. Em vez de apostar no escuro, vale comparar caminhos diferentes com critérios claros e testar um sem gastar.",
      paths: [
        path("Compare os quatro grandes caminhos", "Vender produtos, prestar serviços, vender conhecimento ou criar conteúdo: cada um exige coisas diferentes de tempo, dinheiro e habilidade.", "R$ 0 — uma hora para avaliar com calma.", "Escolher sem se prender à primeira ideia.", "Anote o que você tem hoje: tempo, dinheiro, habilidades e contatos."),
        path("Teste um serviço simples", "Ofereça algo que você já faz bem para 3 conhecidos e veja a reação antes de decidir.", "R$ 0 — algo que você já sabe fazer.", "Superar a vergonha de oferecer.", "Escreva uma mensagem curta oferecendo o serviço e envie para 3 pessoas."),
        path("Desapego como primeira venda", "Vender itens parados é um teste prático, sem risco, de anunciar e negociar.", "R$ 0 — itens que você não usa.", "Boas fotos e preço justo.", "Separe 10 itens e anuncie hoje."),
      ],
      firstStep: "Escolha 3 ideias que despertaram seu interesse e dê uma nota de 1 a 5 para tempo, investimento, habilidade e procura perto de você. Comece pela de maior nota.",
      ctaLabel: cta,
      isDefault: true,
    }),
  ];
  c.rules = []; // classificação por pontos (c.scoring)

  // ---------------- Oferta (checkout e preço preservados) ----------------
  c.offer = {
    ...c.offer,
    productName: "Rota Invisível",
    priceCents: 1990,
    paymentTerms: "Pagamento único · sem mensalidade",
    buttonLabel: "Quero acessar o Rota Invisível",
    checkoutUrl: "https://pay.kiwify.com.br/7fyz1pO",
    description: "Um guia prático para identificar oportunidades de renda extra, pela internet e fora dela, e organizar a execução.",
    benefits: ["O universo da renda extra", "Dinheiro pela internet", "Oportunidades fora da internet", "Começando com pouco", "Como encontrar clientes", "Ferramentas para começar", "Plano de execução de 30 dias"],
    bonuses: [
      { title: "30 ideias de renda extra", description: "Cada ideia com investimento, tempo, onde encontrar clientes e o primeiro passo.", imageUrl: "" },
      { title: "Kit de ferramentas gratuitas", description: "Ferramentas grátis organizadas por tarefa: atendimento, conteúdo, organização, finanças e pedidos.", imageUrl: "" },
      { title: "Guia para encontrar clientes", description: "Método em 5 passos, scripts de abordagem prontos, follow-up e respostas para objeções.", imageUrl: "" },
      { title: "Plano de execução de 30 dias", description: "Tarefas diárias para escolher, oferecer, ajustar e consolidar sua atividade.", imageUrl: "" },
    ],
    guarantee: "", // preencha com a política real do produto
    guaranteeDays: null,
  };

  // ---------------- Página de vendas ----------------
  c.salesPage = {
    theme: { ...dark },
    brand: { name: "Rota Invisível", tagline: "Guia prático de renda extra", logoUrl: "" },
    effects: true,
    skipQuiz: true, // o link do anúncio abre direto a página de vendas
    blocks: [
      // 1 — Hero
      b("hero", {
        badge: "Guia prático + 4 bônus",
        headline: "Você não precisa continuar tentando descobrir sozinho como conseguir uma renda extra.",
        subheadline: "Descubra oportunidades, conheça diferentes modelos de renda e tenha um plano prático para começar com os recursos que já possui. Um guia direto para quem quer sair da dúvida e transformar ideias em ações.",
        ctaLabel: "Quero começar agora",
        ctaAction: "checkout",
        showPrice: true,
      }),

      // 2 — Resultado do quiz (só para quem respondeu)
      b("personalized", {
        tone: "surface",
        eyebrow: "Analisamos suas respostas",
        title: "Seu próximo passo pode começar com aquilo que você já tem.",
        summary: [
          { id: "s_sit", label: "Situação atual", questionId: "situacao" },
          { id: "s_dif", label: "Maior dificuldade", questionId: "dificuldade" },
          { id: "s_obj", label: "Renda que faria diferença", questionId: "objetivo" },
          { id: "s_conq", label: "O que quer conquistar", questionId: "conquista" },
          { id: "s_pref", label: "Disposto a experimentar", questionId: "preferencia" },
          { id: "s_tempo", label: "Tempo por dia", questionId: "tempo" },
        ],
        // frases discretas que conectam as respostas ao conteúdo REAL do guia (sem prometer resultado)
        insights: [
          { id: "i_tentou", title: "Estruturar a execução desta vez", text: "Você já tentou antes. O plano de 30 dias organiza a execução dia a dia e o guia de clientes mostra como conseguir os primeiros compradores — os dois pontos onde mais gente trava.", when: when("i_tentou", [["attribute", "dificuldade", "equals", "ja_tentou"]]) },
          { id: "i_poucotempo", title: "Alternativas para uma rotina com pouco tempo", text: "Conheça alternativas que podem ser organizadas em uma rotina com pouco tempo disponível: o plano divide as ações em blocos de 30 a 60 minutos.", when: when("i_poucotempo", [["attribute", "dificuldade", "equals", "sem_tempo"], ["attribute", "tempo_disponivel", "equals", "ate_1h"]], "or") },
          { id: "i_dinheiro", title: "Começar sem investir", text: "Você não tem dinheiro para investir agora. Várias das 30 ideias começam com R$ 0 — cada uma informa o investimento e o primeiro passo.", when: when("i_dinheiro", [["attribute", "dificuldade", "equals", "sem_dinheiro"]]) },
          { id: "i_vendas", title: "Vendas sem manter estoque", text: "Explore modelos de vendas, inclusive alternativas que não exigem manter estoque, como encomenda, desapego e afiliados.", when: when("i_vendas", [["attribute", "preferencia", "equals", "vendas"]]) },
          { id: "i_servicos", title: "Transformar habilidades em serviços", text: "O guia apresenta serviços digitais e locais e como apresentar o que você sabe fazer para os primeiros clientes.", when: when("i_servicos", [["attribute", "preferencia", "equals", "servicos"]]) },
          { id: "i_internet", title: "Renda pela internet com ferramentas gratuitas", text: "O capítulo de renda pela internet e o kit de ferramentas mostram serviços digitais, afiliados e produtos digitais que começam com celular.", when: when("i_internet", [["attribute", "preferencia", "equals", "internet"]]) },
          { id: "i_conteudo", title: "Do conteúdo à divulgação", text: "Para quem quer criar conteúdo ou divulgar, o guia mostra formas de monetização, afiliados e produtos digitais.", when: when("i_conteudo", [["attribute", "preferencia", "equals", "conteudo"]]) },
          { id: "i_comecar", title: "Escolher seu primeiro caminho", text: "Conheça diferentes possibilidades e entenda como escolher seu primeiro caminho com critérios claros.", when: when("i_comecar", [["attribute", "dificuldade", "equals", "por_onde_comecar"], ["attribute", "preferencia", "equals", "indefinido"]], "or") },
          { id: "i_clientes", title: "Encontrar os primeiros clientes", text: "Sua maior trava é conseguir clientes. O guia de clientes traz um método em 5 passos e scripts de abordagem prontos para adaptar.", when: when("i_clientes", [["attribute", "dificuldade", "equals", "clientes"]]) },
        ],
        maxInsights: 3,
      }),

      // 3 — Identificação com o problema
      b("text", {
        emphasis: "statement",
        title: "Talvez o problema não seja falta de vontade. Talvez esteja faltando direção.",
        body: "Veja se você se reconhece em alguma destas situações:",
        bullets: [
          "Você quer ganhar dinheiro, mas não sabe qual atividade escolher.",
          "Encontra muitas ideias, mas não sabe quais são viáveis.",
          "Tem medo de investir e perder dinheiro.",
          "Não sabe como encontrar os primeiros clientes.",
          "Começa a pesquisar e termina mais confuso do que começou.",
        ],
      }),
      b("subheadline", { text: "Você não precisa de mais uma lista aleatória de ideias. Precisa de um caminho que consiga colocar em prática.", align: "center" }),

      // 4 — Solução
      b("text", {
        tone: "surface",
        showMockup: true,
        eyebrow: "A solução",
        title: "Conheça o ROTA INVISÍVEL.",
        body: "Um guia prático para identificar oportunidades de renda extra e organizar a execução — do primeiro critério de escolha ao primeiro cliente.\n\nEle reúne possibilidades pela internet e fora dela, alternativas para diferentes níveis de investimento (inclusive R$ 0) e ferramentas gratuitas para começar.",
        bullets: ["Online e offline", "A partir de R$ 0", "Scripts para o primeiro cliente", "Plano de 30 dias"],
      }),

      // 5 — Prévia do conteúdo real (recortes das páginas do material)
      b("preview", {
        eyebrow: "Veja por dentro",
        title: "Antes de comprar, veja o que você vai receber.",
        subtitle: "Estes são recortes reais do material. Deslize para ver um trecho de cada parte.",
        items: [
          { title: "Capítulo 1 — O universo da renda extra", caption: "Como avaliar oportunidades pela sua realidade, e não pela \"melhor do mercado\".", imageUrl: "/produto/previa/capitulo-1.jpg" },
          { title: "Bônus — 30 ideias de renda extra", caption: "Cada ideia traz investimento, tempo, onde estão os clientes e o primeiro passo.", imageUrl: "/produto/previa/ideias.jpg" },
          { title: "Bônus — Guia para encontrar clientes", caption: "Scripts de abordagem prontos para adaptar e enviar.", imageUrl: "/produto/previa/clientes.jpg" },
          { title: "Bônus — Plano de execução de 30 dias", caption: "Tarefas do dia a dia, começando pela decisão do que fazer.", imageUrl: "/produto/previa/plano-30-dias.jpg" },
          { title: "Bônus — Kit de ferramentas gratuitas", caption: "Ferramentas grátis organizadas por tarefa.", imageUrl: "/produto/previa/ferramentas.jpg" },
        ],
        note: "Amostras parciais. O material completo é liberado após a confirmação do pagamento.",
      }),

      // 5b — Entregáveis (o que chega e em que formato)
      b("deliverables", {
        tone: "surface",
        eyebrow: "O que você recebe",
        title: "Tudo o que chega para você por R$ 19,90",
        subtitle: "Um guia principal e 4 bônus práticos, para ler no celular ou baixar em PDF.",
        screenImageUrl: "/produto/previa/capitulo-1.jpg",
        formats: ["Guia e bônus em PDF para baixar", "Acesso pela área de membros", "Leitura no celular ou no computador", "Liberado após a confirmação do pagamento"],
      }),

      // 6 — O que você vai receber
      b("content", {
        numbered: true,
        eyebrow: "O que você vai receber",
        title: "7 capítulos, do panorama ao plano de ação.",
        items: [
          { title: "O universo da renda extra", description: "Entenda os quatro grandes caminhos e use critérios para avaliar qualquer oportunidade." },
          { title: "Dinheiro pela internet", description: "Serviços digitais, marketplaces, afiliados, produtos digitais e conteúdo — com o que cada um exige." },
          { title: "Oportunidades fora da internet", description: "Alimentação, revenda, serviços locais e negócios sazonais para vender perto de você." },
          { title: "Como começar com pouco", description: "O que fazer em cada faixa de orçamento e como vender antes de gastar." },
          { title: "Como encontrar clientes", description: "Onde estão os primeiros compradores e como abordar sem parecer insistente." },
          { title: "Ferramentas para começar", description: "Recursos gratuitos que resolvem atendimento, divulgação e organização." },
          { title: "Plano de execução de 30 dias", description: "Um roteiro dia a dia para sair da ideia e chegar às primeiras ações." },
        ],
      }),

      // 7 — Bônus
      b("bonuses", { title: "Os 4 bônus em detalhe" }),

      // 8 — Para quem é e para quem não é
      b("fit", {
        title: "Para quem é o ROTA INVISÍVEL",
        yesTitle: "É para você se",
        yes: [
          "Quer começar uma atividade de renda extra.",
          "Está perdido entre muitas possibilidades.",
          "Quer conhecer alternativas com diferentes níveis de investimento.",
          "Precisa de orientação para encontrar clientes.",
          "Quer organizar um plano de execução.",
        ],
        noTitle: "Não é para você se",
        no: ["Espera ganhar dinheiro sem executar nenhuma atividade.", "Procura uma promessa de renda garantida.", "Quer uma fórmula mágica de enriquecimento."],
      }),

      // 9 — Avaliações reais de compradores (oculto até haver avaliações aprovadas)
      b("reviews", { title: "Quem comprou, avalia" }),

      // 10 — Oferta
      b("offerCard", {
        title: "Tenha um caminho mais claro para começar",
        items: ["Guia Rota Invisível — 7 capítulos", "Bônus: 30 ideias de renda extra", "Bônus: Kit de ferramentas gratuitas", "Bônus: Guia para encontrar clientes", "Bônus: Plano de execução de 30 dias"],
        buttonLabel: "Quero acessar o Rota Invisível",
        note: "Acesso digital após a confirmação do pagamento · Compra segura pela Kiwify",
      }),

      // 11 — Perguntas frequentes
      b("faq", {
        tone: "surface",
        title: "Perguntas frequentes",
        items: [
          { question: "Preciso ter experiência?", answer: "Não. O guia parte do básico e explica o que cada caminho exige. Os primeiros passos foram pensados para quem está começando do zero." },
          { question: "Preciso investir dinheiro?", answer: "Não necessariamente. Várias ideias começam com R$ 0 e outras pedem algum investimento — cada uma informa quanto, para você decidir com segurança." },
          { question: "O material ensina apenas a ganhar dinheiro pela internet?", answer: "Não. Há um capítulo inteiro sobre oportunidades fora da internet, como alimentação, revenda, serviços locais e negócios sazonais." },
          { question: "Como recebo o produto?", answer: "Após a confirmação do pagamento, a Kiwify envia para o seu e-mail o acesso à área de membros, onde ficam o guia e os 4 bônus." },
          { question: "Posso acessar pelo celular?", answer: "Sim. O material é digital: você pode ler no celular ou no computador e baixar em PDF." },
          { question: "Vou conseguir ganhar dinheiro imediatamente?", answer: "Não há garantia de resultado financeiro. O guia apresenta caminhos, ferramentas e um plano de execução; os resultados dependem da sua dedicação, do seu contexto e da sua aplicação." },
          { question: "O pagamento é único?", answer: "Sim. R$ 19,90 uma única vez, sem mensalidade." },
          { question: "E se eu me arrepender da compra?", answer: "Compras pela internet têm direito de arrependimento de 7 dias (art. 49 do Código de Defesa do Consumidor). Dentro desse prazo, você pode pedir o reembolso pela própria Kiwify." },
        ],
      }),

      // 12 — CTA final
      b("ctaSection", {
        headline: "Você pode continuar procurando ideias ou começar a organizar seu próximo passo.",
        subheadline: "Conheça o ROTA INVISÍVEL e tenha acesso a um guia prático para identificar oportunidades e começar a executar.",
        buttonLabel: "Quero meu acesso por R$ 19,90",
        ctaAction: "checkout",
      }),

      // 13 — Rodapé (responsável, privacidade e termos vêm das Configurações)
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
    description: "Funil completo do guia Rota Invisível: quiz em 4 etapas (genéricas, dor, desejo, solução), 6 perfis por pontuação, resultado justificado pelas respostas e página de vendas com prévia real do material.",
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

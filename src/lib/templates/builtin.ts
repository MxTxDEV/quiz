import type { Block, CampaignConfig, Condition, Profile, Question, QuestionType, Rule } from "@/lib/domain/config";
import { emptyConfig } from "@/lib/domain/config";

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
const b = <T extends Block["type"]>(type: T, props: Omit<Extract<Block, { type: T }>, "id" | "type" | "profileIds"> & { profileIds?: string[] }) =>
  ({ id: `b${++n}`, type, profileIds: [], ...props }) as unknown as Extract<Block, { type: T }>;

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

export const builtinTemplates: { key: string; name: string; description: string; category: string; config: CampaignConfig }[] = [
  { key: "renda-extra", name: "Quiz de renda extra", description: "7 perguntas sobre tempo, capital e preferência. 4 perfis.", category: "Renda extra", config: rendaExtra() },
  { key: "descoberta-perfil", name: "Quiz de descoberta de perfil", description: "Perfil comportamental por pontuação.", category: "Perfil", config: descobertaPerfil() },
  { key: "recomendacao-produto", name: "Quiz de recomendação de produto", description: "Recomenda a opção ideal por prioridade e orçamento.", category: "Produto", config: recomendacaoProduto() },
  { key: "qualificacao-clientes", name: "Quiz de qualificação de clientes", description: "Qualifica leads por orçamento, urgência e poder de decisão.", category: "B2B", config: qualificacaoClientes() },
  { key: "empreendedorismo", name: "Quiz de empreendedorismo", description: "Identifica a fase do negócio.", category: "Negócios", config: empreendedorismo() },
  { key: "marketing-digital", name: "Quiz de marketing digital", description: "Nível de conhecimento por pontuação.", category: "Marketing", config: marketingDigital() },
];

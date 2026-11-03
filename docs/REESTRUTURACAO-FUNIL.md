# Reestruturação do funil ROTA INVISÍVEL — relatório

## 1. Diagnóstico (auditoria)

| Área | O que existia | Situação |
|---|---|---|
| Quiz | `src/components/public/quiz-runner.tsx`, API `/api/public/{session,answer,complete}`, motor `src/lib/engine/{answers,rules}.ts` | Sólido. Respostas são validadas no servidor e viram atributos; a primeira regra atendida define o perfil. |
| Resultado | Título, subtítulo e listas genéricas por perfil | 4 perfis, todos com praticamente o mesmo formato e nenhuma justificativa ligada às respostas. |
| Página de vendas | `src/components/public/sales-page.tsx` (blocos configuráveis), `/q/[slug]/oferta` | Listava capítulos e bônus, mas não mostrava o conteúdo real. |
| Checkout | `/api/public/checkout` → Kiwify com `sck`, `src`, `fos_sid` e UTMs | Funcionando. URL e preço preservados. |
| Kiwify | Webhook com HMAC-SHA1 (`?signature=`); só `paid`/`approved` contam como venda; deduplicação por `provider + order_id` | Correto: Pix gerado e boleto emitido **não** contam. A venda real não apareceu no FunnelOS porque o **webhook ainda não está configurado** na Kiwify. |
| Meta Pixel | `tracking-scripts.tsx` + `pixel.ts` (PageView, StartQuiz, CompleteRegistration, ViewContent, ViewOffer, InitiateCheckout) | **2 falhas encontradas e corrigidas** (seção 6). O site nunca dispara Purchase; quem dispara é o pixel configurado na Kiwify. |

## 2. Quiz (nova abertura e 7 perguntas)

- Abertura: "Você quer ganhar dinheiro extra, mas ainda não sabe por onde começar?", com selo "Teste gratuito · resultado na hora", 3 chips (seu tempo, seu orçamento, suas habilidades), o botão **DESCOBRIR MEU CAMINHO** e "São apenas 7 perguntas rápidas. Leva menos de 2 minutos."
- As 7 perguntas usam a redação definida. Entraram duas opções novas: **"Quero começar sem investir"** (pergunta 3) e **"Trabalhar pela internet"** (pergunta 4).
- Continua com uma pergunta por tela, barra de progresso, avanço automático e botões grandes. Nenhum campo de e-mail ou telefone foi adicionado.

## 3. Resultado realmente personalizado

**Lógica:** 7 perfis definidos pela combinação de respostas. A primeira regra que bate define o perfil (`src/lib/templates/builtin.ts`):

| Ordem | Perfil | Quando |
|---|---|---|
| 1 | Empreendedor do bairro | Quer atuar na região **e** tem R$ 50 ou mais **e** prefere vender ou ainda não sabe |
| 2 | Vendedor sem estoque | Prefere vender produtos |
| 3 | Prestador de serviços local | Prefere serviços **e** aceita atuar na região |
| 4 | Prestador de serviços digitais | Prefere serviços (só on-line) **ou** trabalhar pela internet |
| 5 | Criador de conteúdo | Prefere criar conteúdo |
| 6 | Iniciante com pouco capital | Ainda não sabe **e** tem até R$ 50 |
| — | Explorador de oportunidades (padrão) | Ainda não sabe **e** tem R$ 50 ou mais |

**Página de resultado:**
1. Análise concluída.
2. Perfil, com explicação.
3. **Por que combina com você:** 3 frases tiradas das respostas reais (investimento, tempo e preferência).
4. **3 caminhos**, cada um com como funciona, o que precisa para começar, principal dificuldade e primeiro passo.
5. Primeiro passo prático, que dá para fazer hoje.
6. Transição: "Agora você já tem uma direção…" e o botão **QUERO CONHECER MEU PLANO DE AÇÃO**.

Todos os caminhos saem das 30 ideias e dos capítulos do e-book.

**Garantias testadas em todas as 7.200 combinações de respostas** (`tests/funnel.test.ts`):
- Todas geram perfil completo: 3 justificativas, 3 caminhos detalhados e primeiro passo.
- Os 7 perfis são alcançáveis.
- Quem quer começar sem investir, ou com até R$ 50, **nunca** recebe caminho que dependa de capital.
- O perfil respeita a atividade preferida.
- Quem escolheu "pela internet" nunca recebe serviço presencial.

## 4. Página de vendas (13 blocos, mobile first)

Hero (headline nova, mockup com aura, preço, **QUERO COMEÇAR AGORA**) → resumo das respostas de quem fez o quiz → "Talvez o problema não seja falta de vontade…" com 5 situações → solução → **prévia real do material** → 7 capítulos com o benefício de cada um → 4 bônus com descrição específica → **para quem é / não é** → avaliações reais (oculto enquanto não houver) → oferta (R$ 19,90, pagamento único, acesso digital) → 8 perguntas frequentes (incluindo o direito de arrependimento de 7 dias do CDC) → CTA final **QUERO MEU ACESSO POR R$ 19,90** → rodapé legal.

Não há preço riscado, contador, escassez, depoimento inventado nem promessa de ganho.

### Amostras reais usadas (prévia)
Os recortes são gerados de forma automática a partir das páginas do e-book entregue (`node ebook/previa.mjs`). Ficam em `public/produto/previa/`, e nenhum texto foi reescrito:

| Arquivo | Trecho |
|---|---|
| `capitulo-1.jpg` | Capítulo 1 — "O que é, de fato, uma renda extra" e o início de "Os quatro grandes caminhos" |
| `ideias.jpg` | Bônus 30 ideias — Grupo 1, ideias 01 a 04 (investimento, tempo, onde e primeiro passo) |
| `clientes.jpg` | Guia de clientes — "Scripts de abordagem" 1 e 2 |
| `plano-30-dias.jpg` | Plano de 30 dias — Semana 1, dias 1 a 3 |
| `ferramentas.jpg` | Kit de ferramentas — "1. Atendimento e vendas" |

São amostras parciais. O material completo continua só na área de membros.

## 5. Painel

- **Menu da campanha (⋯) → "Atualizar com o modelo Rota Invisível":** atualiza o **rascunho** com quiz, perfis, regras, resultado e página. Preserva checkout, preço, preço de referência, garantia, pixel e captura de leads. Nada vai ao ar até publicar.
- Aba **Resultados e regras**: edição dos caminhos (até 4) e do primeiro passo de cada perfil.
- Aba **Quiz → Introdução e configurações**: textos da página de resultado.
- Página de vendas: blocos novos **Prévia do material** e **Para quem é / não é**.

## 6. Rastreamento corrigido

| Problema | Correção |
|---|---|
| Eventos disparados antes de o Pixel carregar eram descartados (ViewContent ao abrir a página; StartQuiz sem introdução) | Fila em `pixel.ts`: o evento espera o Pixel por até 10 s e é enviado assim que ele existe |
| A ida imediata ao checkout podia cancelar o envio do InitiateCheckout | O clique aguarda cerca de 220 ms antes de navegar (Ctrl/Cmd+clique segue normal) |
| Duplicidade possível (recarregar, clique duplo, efeitos repetidos) | StartQuiz, CompleteRegistration, ViewContent, ViewOffer e InitiateCheckout disparam no máximo 1 vez por página e visita |

**Purchase:** o site **não** dispara Purchase, então não há duplicidade entre Pixel e CAPI do nosso lado. A venda chega ao Meta pelo pixel configurado na Kiwify e ao FunnelOS pelo webhook validado, que só conta pagamento aprovado.

## 7. Testes executados

- `npx vitest run`: **63 testes passando**. Incluem as 7.200 combinações, o fluxo público completo, a página de vendas, as avaliações, a atualização pelo modelo preservando checkout e pixel, e a validação de imagens.
- `node e2e/funil.mjs`: navegador simulando iPhone 13, 3 perfis diferentes, ponta a ponta. Resultados:
  - Perfil coerente em cada caso.
  - Justificativas e caminhos exibidos.
  - Página de vendas personalizada, com as 5 prévias.
  - Botão de compra levando à Kiwify com UTMs e `sck`.
  - Eventos do Pixel com o Pixel carregando 1,5 s atrasado, clique duplo e duplo clique em comprar: StartQuiz, CompleteRegistration, ViewContent, ViewOffer e InitiateCheckout **exatamente 1 vez cada**, e **nenhum Purchase**.
- `next build`: compilação de produção sem erros.
- Nenhuma compra real foi feita.

## 8. Pendências (exigem ação sua)

1. **Publicar:** menu da campanha → **Atualizar com o modelo Rota Invisível** → revisar → **Publicar alterações**.
2. **Webhook da Kiwify:** FunnelOS → Integrações → Novo endpoint → Kiwify → copie a URL e o token → cole na Kiwify, em Webhooks do produto, com os eventos de compra aprovada, reembolso e chargeback. Sem isso, as vendas não aparecem no FunnelOS e as avaliações não recebem o selo de compra verificada.
3. **Pixel na Kiwify:** confira que o Purchase é enviado só em **pagamento aprovado**. Se houver opção de disparar Purchase em "Pix gerado" ou "boleto gerado", desative. Se usar a API de Conversões da Kiwify, mantenha um único caminho de Purchase.
4. **Comparar Kiwify × FunnelOS:** Analytics → últimas vendas mostra o ID do pedido (`order_id`), para conferir com o relatório da Kiwify.

## 9. Melhorias futuras recomendadas

- Teste A/B da abertura do quiz (com e sem introdução) quando houver cerca de 300 visitas por variação.
- Order bump na Kiwify com um complemento real, por exemplo planilhas, para aumentar o ticket médio.
- E-mail de boas-vindas pós-compra com o link de avaliação, para acumular prova social real.
- Revisar as taxas do funil a cada 100 visitas. Com os dados atuais (78 visitas, 1 venda), qualquer conclusão ainda é só um sinal inicial.

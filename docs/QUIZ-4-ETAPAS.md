# Quiz ROTA INVISÍVEL: estrutura em 4 etapas

Jornada contínua em 4 etapas: **Genéricas → Dor → Desejo → Solução**. São 7 perguntas, uma por tela, e cada uma mostra a etapa atual ("Etapa X de 4 — …").

## Perguntas, etapas e pontos

A classificação é feita **por pontos** (`config.scoring.mode = "points"`). Cada resposta soma pontos a um ou mais perfis; o total de pontos aparece em `quiz_completed.metadata.points` no FunnelOS, para auditoria.

Perfis: **iniciante** (Iniciante com pouco investimento) · **internet** (Renda pela internet) · **vendas** (Perfil comercial e de vendas) · **servicos** (Prestação de serviços) · **pouco_tempo** (Pouco tempo disponível) · **direcao** (Encontrando sua direção).

| Etapa | Pergunta | Resposta | Pontos |
|---|---|---|---|
| 1 Conhecendo você | Situação financeira | Tranquilo, mas quer ganhar mais | — |
| | | Paga as contas, mas sobra pouco | iniciante +1 |
| | | Dinheiro acaba antes do fim do mês | iniciante +2 |
| | | Precisa de nova fonte de renda | iniciante +1, servicos +1, vendas +1 |
| 2 Sua realidade | Maior dificuldade | Não sei por onde começar | direcao +2, iniciante +1 |
| | | Não tenho dinheiro para investir | iniciante +3 |
| | | Não tenho tempo disponível | pouco_tempo +3 |
| | | Já tentei e não consegui | direcao +1 (e a frase de atenção à execução e aos clientes) |
| | | Não sei encontrar clientes | servicos +1, vendas +1 |
| 2 Sua realidade | O que mais incomoda | Depender do salário | internet +1 |
| | | Não realizar planos | — |
| | | Trabalhar muito e continuar sem dinheiro | pouco_tempo +1 |
| | | Não ter liberdade financeira | internet +1 |
| | | Sentir que está parado | direcao +1 |
| 3 Seus objetivos | Renda que faria diferença | 4 faixas | — (muda o texto de "Por que esse caminho?") |
| 3 Seus objetivos | O que quer conquistar | Quitar dívidas | iniciante +1 |
| | | Liberdade para escolher como viver | internet +1 |
| | | Demais opções | — (texto) |
| 4 Seu caminho | Alternativa que experimentaria | Vender sem estoque | vendas +5 |
| | | Prestar serviços | servicos +5 |
| | | Trabalhar pela internet | internet +5 |
| | | Criar conteúdo ou divulgação | internet +5 |
| | | Ainda não sei | direcao +4, iniciante +1 |
| 4 Seu caminho | Tempo por dia | Até 1 hora | pouco_tempo +6 |
| | | De 1 a 3 horas | — |
| | | Mais de 3 horas | servicos +1, vendas +1 |

**Vence o maior total.** Em caso de **empate**, vale esta ordem: `pouco_tempo → iniciante → servicos → vendas → internet → direcao`. As restrições práticas (tempo e dinheiro) vêm antes das preferências; a orientação ampla fica por último.

**Por que esses pesos:** a alternativa escolhida (+5) é o sinal mais forte. "Até 1 hora" (+6) supera a preferência, a não ser que outras respostas reforcem a preferência. "Sem dinheiro" (+3) somado a uma situação apertada (+1 a +2) e a "quitar dívidas" (+1) também passa à frente. Assim, ninguém recebe um caminho incompatível com o tempo ou o dinheiro que declarou.

**Garantia por desenho:** o quiz não pergunta capital, por isso **todas** as oportunidades de **todos** os perfis começam com R$ 0 (no máximo R$ 50, na venda sob encomenda) e cabem em blocos de 30 a 60 minutos.

## Como as respostas aparecem no resultado

1. **Análise concluída:** perfil vencedor.
2. **Sua realidade:** 4 frases, uma para cada resposta de situação, dificuldade, alternativa e tempo.
3. **Por que esse caminho?:** explicação do perfil e 3 frases que ligam respostas e recomendação, em ordem de prioridade:
   - já tentou (atenção à execução e aos clientes);
   - sem dinheiro;
   - pouco tempo;
   - clientes;
   - não sabe por onde começar;
   - quitar dívidas;
   - meta de renda (com realismo para mais de R$ 2.000);
   - segunda fonte;
   - frase geral.
4. **3 oportunidades:** como funciona, o que precisa, principal desafio e primeiro passo.
5. **Primeiro passo para hoje.**
6. **Conexão com o produto:** **QUERO CONHECER O ROTA INVISÍVEL**, que leva à página de vendas com `?s=<sessão>`. Nenhum dado pessoal vai na URL.

A transição de análise mostra 3 etapas reais ("Analisando…", "Identificando…", "Preparando…"), que correspondem ao cálculo de pontos feito no servidor. Não há simulação de inteligência artificial.

## Página de vendas

O bloco "Analisamos suas respostas" mostra as respostas reais da pessoa e até 3 textos que ligam essas respostas ao conteúdo do guia. Alguns exemplos:
- pouco tempo → alternativas para uma rotina curta;
- vendas → modelos sem estoque;
- não sabe por onde começar ou ainda não sabe → como escolher o primeiro caminho;
- já tentou → plano de 30 dias e guia de clientes;
- sem dinheiro → ideias de R$ 0.

O conteúdo do produto e o preço não mudam.

## Rastreamento

- Continuam como estavam: PageView, StartQuiz, CompleteRegistration (com o nome do perfil em `content_category`, sem dados pessoais), ViewContent, ViewOffer e InitiateCheckout.
- **Purchase** só pela Kiwify, com pagamento aprovado.
- FunnelOS registra:
  - `quiz_started`;
  - respostas;
  - `quiz_completed` (com perfil e pontos);
  - `result_viewed`;
  - `sales_page_view`;
  - `purchase_button_click`;
  - `checkout_redirect`;
  - `purchase_confirmed` (webhook).
- **Recarregar a página** no meio do quiz retoma na mesma pergunta e com a mesma sessão. Não cria visita nova nem duplica o início do quiz.

## Testes

- `tests/funnel.test.ts`: as **30.000 combinações** de respostas. Verifica:
  - resultado completo;
  - os 6 perfis alcançáveis;
  - vencedor sempre igual ao maior total, com empate na ordem documentada;
  - nenhuma oportunidade acima de R$ 50 ou com bloco longo de tempo;
  - "até 1 hora + sem tempo" sempre leva a Pouco tempo;
  - perfil coerente com a alternativa escolhida;
  - "já tentou" recebe a atenção à execução em primeiro lugar;
  - casos representativos.
- `e2e/funil.mjs`: celular (iPhone 13), 3 perfis. Cobre:
  - etapas visíveis;
  - voltar mantém a resposta;
  - recarregar retoma com a mesma sessão;
  - transição em etapas;
  - seções do resultado;
  - página de vendas personalizada;
  - checkout com UTMs e `sck`;
  - eventos do Pixel sem duplicidade, incluindo com o Pixel carregando atrasado;
  - nenhum Purchase disparado pelo site.

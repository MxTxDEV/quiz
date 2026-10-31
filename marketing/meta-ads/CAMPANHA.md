# Campanha de vendas no Facebook e Instagram — ROTA INVISÍVEL

Plano completo para subir no **Gerenciador de Anúncios da Meta**: funil, configuração, públicos, orçamento,
criativos, textos, rastreamento e regras de otimização.

---

## 1. O funil

```
Anúncio (Facebook/Instagram)
   ↓  clique (com UTMs)
Quiz no FunnelOS — /q/rota-invisivel   ← evento StartQuiz / CompleteRegistration
   ↓  resultado personalizado
Página de vendas personalizada          ← ViewContent / InitiateCheckout
   ↓  botão de compra
Checkout Kiwify (R$ 19,90)              ← Purchase (pixel configurado na Kiwify)
   ↓
Área do aluno (link do e-book)
```

**Por que mandar o anúncio para o quiz, e não direto para a página de vendas?** O quiz aumenta o interesse
("qual caminho combina comigo?"), filtra curiosos e entrega uma página de vendas personalizada com as respostas
da pessoa. Para um produto de baixo ticket, é o que mais costuma converter tráfego frio.

> **Link de destino dos anúncios:** `https://rotainvisivel.vercel.app/q/rota-invisivel`
> Ao criar a campanha no FunnelOS a partir do modelo, use o slug **`rota-invisivel`** (ou troque o link acima
> pelo slug que você escolheu). Publique a campanha antes de subir os anúncios.

---

## 2. Checklist antes de anunciar

- [ ] **Campanha publicada no FunnelOS** (modelo Rota Invisível, checkout Kiwify preenchido, garantia real configurada).
- [ ] **Meta Pixel no FunnelOS:** Integrações → Rastreamento global → Meta Pixel ID. Isso registra no Meta o
      início do quiz, a conclusão, a visualização da página e o clique em comprar — sem dados pessoais.
- [ ] **Meta Pixel na Kiwify:** no produto, em Pixels/Integrações, adicione o **mesmo Pixel ID**. A compra
      (evento **Purchase**) acontece no checkout da Kiwify, então é ela quem envia a venda para o Meta.
      Se a Kiwify oferecer a opção de API de Conversões (token do Meta), ative também: melhora a medição.
- [ ] **Webhook Kiwify → FunnelOS** (Integrações → Novo endpoint → Kiwify), para o painel mostrar vendas por
      anúncio, perfil e origem.
- [ ] **Teste de ponta a ponta:** clique em um link com UTMs, responda o quiz, vá até o checkout e confira se os
      eventos aparecem no **Gerenciador de Eventos** do Meta (aba "Testar eventos").
- [ ] **Página do Facebook e conta do Instagram** com foto, nome e bio do Rota Invisível.
- [ ] **Recomendado:** um domínio próprio (ex.: `rotainvisivel.com.br`) apontando para a Vercel. Passa mais
      confiança no anúncio e permite **verificar o domínio** no Gerenciador de Negócios.

---

## 3. A conta que decide se a campanha dá lucro

| Item | Valor |
|---|---|
| Preço | R$ 19,90 |
| Taxa da Kiwify | confira no seu painel (varia por forma de pagamento) |
| **Receita líquida por venda** | ≈ R$ 19,90 – taxa (estimativa: R$ 16 a R$ 18) |
| **CPA de equilíbrio** (empate) | igual à receita líquida |
| **CPA alvo para lucrar** | abaixo de ~R$ 13 a R$ 15 |

- **CPA** = investimento ÷ vendas confirmadas (o FunnelOS calcula sozinho quando você lança o investimento em
  *Analytics da campanha*).
- Produto de R$ 19,90 tem margem apertada. Duas alavancas para melhorar no futuro: **order bump** no checkout
  da Kiwify (ex.: um material complementar por R$ 9,90) e **upsell** após a compra.

---

## 4. Estrutura da campanha (fase de teste)

### Campanha
| Configuração | Valor |
|---|---|
| Nome | `RI | Vendas | Teste | {data}` |
| Objetivo | **Vendas** |
| Tipo | Campanha manual de vendas (ou Advantage+ de vendas, se preferir automação total) |
| Orçamento | Do conjunto de anúncios (ABO) na fase de teste |
| Categoria especial | Nenhuma |

### Conjunto de anúncios
| Configuração | Valor |
|---|---|
| Nome | `Amplo | BR | 22-55` |
| Local da conversão | Site |
| Pixel e evento | Seu pixel · **Compra (Purchase)** |
| Orçamento diário | **R$ 30 a R$ 50** |
| Público | **Brasil**, idade **22–55**, todos os gêneros, idioma português. Público Advantage+ ativado (amplo). |
| Interesses (opcional) | Se quiser direcionar: renda extra, empreendedorismo, trabalho em casa, vendas, marketing digital — como *sugestão*, não como restrição. |
| Posicionamentos | **Advantage+** (automático) |
| Atribuição | 7 dias após o clique ou 1 dia após a visualização |

> **Se a conta de anúncios é nova e o pixel ainda não tem vendas:** otimize para **Compra** mesmo assim e dê
> tempo (5 a 7 dias). Se depois de ~R$ 150 a R$ 200 investidos não houver nenhuma compra, crie um conjunto
> otimizado para **Finalização de compra iniciada (InitiateCheckout)** para alimentar o pixel, e volte para
> Compra quando houver dados.

### Anúncios (4 no mesmo conjunto)
| Nome do anúncio | Criativo | Ângulo |
|---|---|---|
| `A-gancho-dinheiro` | anuncio-A (feed + stories) | "Você não precisa de mais dinheiro para começar" |
| `B-quiz-rotina` | anuncio-B (feed + stories) | Curiosidade: "Qual renda extra combina com a sua rotina?" |
| `C-objecoes` | anuncio-C (feed + stories) | Pouco tempo, pouco dinheiro, sem experiência |
| `D-oferta` | anuncio-D (feed + stories) | Guia + 4 bônus por R$ 19,90 |

Em cada anúncio, use **"Personalizar posicionamentos"/"Selecionar mídia por posicionamento"**: imagem 4:5 para
feeds e imagem 9:16 para Stories e Reels.

### Parâmetros de URL (colar em todos os anúncios)

No campo **Parâmetros de URL** do anúncio:

```
utm_source=facebook&utm_medium=paid&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}
```

O Meta troca as variáveis pelos nomes reais. No FunnelOS, o relatório **"Por UTM content (criativo)"** mostra
visitantes, quizzes concluídos, cliques e vendas de **cada anúncio**.

**Botão (CTA) do anúncio:** "Saiba mais" (tom de descoberta, combina com o quiz). Teste "Comprar agora" apenas no anúncio D.

---

## 5. Textos dos anúncios

> Regras seguidas: nenhuma promessa de ganho, nenhuma pergunta sobre a situação pessoal do usuário
> ("você está endividado?" é proibido pelas políticas do Meta), nada de urgência falsa.

### Anúncio A — "Você não precisa de mais dinheiro para começar"

**Texto principal (versão 1):**
> Muita gente adia a renda extra porque acha que precisa de dinheiro para começar.
>
> Mas existem caminhos que começam com o que você já tem: uma habilidade, algumas horas na semana, os
> contatos do seu celular.
>
> Responda 7 perguntas rápidas e descubra qual caminho combina com a sua rotina. É gratuito e leva menos de 2 minutos. 👇

**Texto principal (versão 2 — curta):**
> Você não precisa de mais dinheiro para começar. Precisa descobrir os caminhos que ainda não enxergou.
> Faça o quiz gratuito e veja qual combina com você. 👇

**Título:** Descubra seu caminho de renda extra
**Descrição:** Quiz gratuito · 2 minutos

### Anúncio B — "Qual renda extra combina com a sua rotina?"

**Texto principal (versão 1):**
> Vender produtos, prestar serviços, criar conteúdo… qual desses caminhos combina mais com você?
>
> Responda 7 perguntas sobre o seu tempo, o seu orçamento e o que você gosta de fazer — e receba uma
> orientação personalizada na hora.

**Texto principal (versão 2):**
> Tem 1 hora por dia? Prefere vender ou prestar serviço? Pode investir pouco ou nada?
> Cada resposta muda o caminho mais indicado. Faça o quiz e descubra o seu. 👇

**Título:** Qual renda extra combina com você?
**Descrição:** 7 perguntas · resultado na hora

### Anúncio C — "Pouco tempo, pouco dinheiro, sem experiência"

**Texto principal (versão 1):**
> Pouco tempo. Pouco dinheiro. Nenhuma experiência.
>
> Ainda assim, existem formas de começar uma renda extra — pela internet ou perto de casa. O primeiro passo é
> conhecer as possibilidades e escolher uma que caiba na sua realidade.
>
> Faça o quiz gratuito e veja por onde começar.

**Texto principal (versão 2):**
> Começar uma renda extra não exige largar tudo nem investir muito. Exige direção.
> Descubra, em 2 minutos, qual caminho faz sentido para o seu tempo e o seu orçamento. 👇

**Título:** Existem caminhos para você
**Descrição:** Descubra por onde começar

### Anúncio D — Oferta

**Texto principal (versão 1):**
> ROTA INVISÍVEL é um guia prático para quem quer começar uma renda extra com pouco tempo e pouco dinheiro.
>
> ✓ Modelos de renda pela internet e fora dela
> ✓ Alternativas de baixo investimento
> ✓ Como encontrar os primeiros clientes
> ✓ Plano de execução de 30 dias
>
> + 4 bônus: 30 ideias de renda extra, kit de ferramentas gratuitas, scripts para conseguir clientes e plano diário.
>
> Acesso imediato por R$ 19,90. Comece pelo quiz e veja o caminho indicado para você. 👇

**Título:** Guia + 4 bônus por R$ 19,90
**Descrição:** Acesso imediato · produto digital

### Títulos extras para testar
- Encontre caminhos que você ainda não enxergou
- Renda extra começando com o que você já tem
- Seu próximo passo começa em 2 minutos
- Um mapa prático para sua renda extra

---

## 6. Roteiros de Reels (para gravar no celular ou montar no CapCut)

Vídeo costuma baratear o clique. Grave em pé (9:16), com luz natural, e coloque legendas.

### Reels 1 — "Pare de procurar a ideia perfeita" (15–20 s)
| Tempo | Cena | Texto na tela / fala |
|---|---|---|
| 0–3 s | Você olhando para a câmera | "Você não precisa de mais dinheiro para começar uma renda extra." |
| 3–8 s | Mão rolando o celular (vídeos de "ganhe dinheiro") | "Precisa parar de pular de ideia em ideia…" |
| 8–14 s | Tela do quiz no celular, tocando nas opções | "…e descobrir qual caminho combina com o seu tempo e o seu orçamento." |
| 14–20 s | Tela do resultado | "Faça o quiz gratuito. Link aqui embaixo." |

### Reels 2 — "3 perguntas" (20–25 s)
| Tempo | Cena | Texto / fala |
|---|---|---|
| 0–3 s | Close no rosto | "Antes de escolher uma renda extra, responda 3 perguntas." |
| 3–8 s | Texto grande na tela | "1. Quanto tempo por dia eu tenho de verdade?" |
| 8–13 s | Texto grande | "2. Quanto posso investir sem apertar as contas?" |
| 13–18 s | Texto grande | "3. Eu prefiro vender, prestar serviço ou criar conteúdo?" |
| 18–25 s | Tela do quiz | "O quiz cruza suas respostas e mostra o caminho mais indicado. Link abaixo." |

### Reels 3 — "O que tem no guia" (25–30 s)
| Tempo | Cena | Texto / fala |
|---|---|---|
| 0–3 s | Celular mostrando a área do aluno | "Isso aqui é o Rota Invisível." |
| 3–15 s | Rolando os capítulos e os bônus | "7 capítulos: renda pela internet, fora dela, como começar com pouco, como achar clientes e um plano de 30 dias." |
| 15–22 s | Mostrando os scripts de WhatsApp | "E bônus com 30 ideias, ferramentas gratuitas e mensagens prontas para conseguir clientes." |
| 22–30 s | Você para a câmera | "R$ 19,90, acesso na hora. Comece pelo quiz — link aqui embaixo." |

> Grave a sua tela no celular para mostrar o quiz e o material. Não exiba números de faturamento, prints de
> "ganhos" ou carros, dinheiro e viagens: além de serem proibidos pelas políticas, derrubam a confiança.

---

## 7. Como ler os resultados e o que fazer

**Regra de ouro:** não mexa na campanha nas primeiras **48 a 72 horas** (fase de aprendizado).

| Métrica (Gerenciador) | Referência saudável* | Se estiver ruim |
|---|---|---|
| CTR (link) | acima de ~1% | Troque o criativo ou o gancho (os 3 primeiros segundos / a frase do topo) |
| CPC (link) | abaixo de ~R$ 1,00 | Mesmo diagnóstico do CTR |
| Taxa de início do quiz (FunnelOS) | acima de ~50% dos visitantes | Primeira tela do quiz: título/subtítulo menos claros que o anúncio |
| Conclusão do quiz (FunnelOS) | acima de ~60% | Veja o **abandono por pergunta** e simplifique a pergunta que mais perde gente |
| Clique em comprar ÷ página de vendas | acima de ~10% | Reveja hero, oferta e prova (página de vendas) |
| Compras ÷ cliques no checkout | acima de ~30% | Problema no checkout (preço, meios de pagamento, confiança) |
| **CPA** | **abaixo do alvo (seção 3)** | Ajuste a etapa que estiver mais fraca acima |

\*Referências aproximadas para comparar e diagnosticar; variam por nicho, época e conta.

### Decisões
- **Anúncio com gasto ≥ 2× o CPA alvo e 0 vendas:** pause.
- **Anúncio com CPA abaixo do alvo por 3 dias:** mantenha e crie variações dele (novo texto, nova cor, versão em vídeo).
- **Conjunto com CPA abaixo do alvo:** aumente o orçamento **20% a 30% a cada 2–3 dias**. Aumentos bruscos
  reiniciam o aprendizado.
- **Depois de encontrar 2 ou 3 anúncios vencedores:** crie a campanha de escala com orçamento de campanha
  (CBO) e os vencedores, e mantenha uma campanha pequena só para testar criativos novos.
- **A cada 1–2 semanas:** suba criativos novos. Criativos se desgastam (frequência acima de ~3 e CTR caindo).

### Remarketing (quando houver tráfego)
Depois de alguns dias, crie um conjunto com **público personalizado do pixel**:
- Quem **iniciou o quiz** ou **viu a página de vendas** nos últimos 7 dias e **não comprou**.
- Orçamento pequeno (R$ 10 a R$ 15/dia), anúncio **D (oferta)** e o **Reels 3**.

---

## 8. Calendário da primeira semana

| Dia | Ação |
|---|---|
| Dia 0 | Checklist da seção 2 completo. Subir a campanha com os 4 anúncios. |
| Dias 1–2 | Não mexer. Acompanhar se os eventos chegam ao Gerenciador de Eventos e ao FunnelOS. |
| Dia 3 | Primeira leitura: CTR e CPC por anúncio. Pausar só o que estiver muito abaixo. |
| Dias 4–5 | Ler o funil no FunnelOS (quiz, página, checkout). Ajustar a etapa mais fraca. |
| Dias 6–7 | Decidir: escalar os vencedores (+20–30%), criar variações e subir os Reels. |

Lance o investimento diário em **FunnelOS → Campanha → Analytics → Investimento em anúncios** para ver CPA e
ROAS reais, calculados apenas com vendas confirmadas pela Kiwify.

---

## 9. Políticas do Meta — o que evitar

Anúncios de "renda extra" são revisados com rigor. Para não ter anúncios reprovados ou a conta restrita:

- ❌ Promessas de ganho ("ganhe R$ 5.000 por mês", "dinheiro garantido", "fique rico").
- ❌ Perguntas ou afirmações sobre a situação pessoal do usuário ("Você está sem dinheiro?", "Desempregado?").
- ❌ Imagens de dinheiro, prints de faturamento, carros e "estilo de vida".
- ❌ Urgência falsa ("só hoje", "últimas vagas") e depoimentos inventados.
- ✅ Foco em **descobrir caminhos, aprender e organizar** — exatamente o que o produto entrega.
- ✅ Página de destino coerente com o anúncio, com política de privacidade e aviso de que resultados não são garantidos (já presentes no FunnelOS).

---

## Arquivos

- `criativos/anuncio-A-feed-4x5.png` · `criativos/anuncio-A-stories-9x16.png`
- `criativos/anuncio-B-feed-4x5.png` · `criativos/anuncio-B-stories-9x16.png`
- `criativos/anuncio-C-feed-4x5.png` · `criativos/anuncio-C-stories-9x16.png`
- `criativos/anuncio-D-feed-4x5.png` · `criativos/anuncio-D-stories-9x16.png`
- Para gerar de novo ou criar variações: `node marketing/meta-ads/gerar-criativos.mjs`

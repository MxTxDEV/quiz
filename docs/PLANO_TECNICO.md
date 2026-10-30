# FunnelOS — Plano técnico de implementação

## 1. Análise da arquitetura proposta

O requisito central é **orientação à configuração**: nenhuma pergunta, resultado, regra ou bloco de página
pode estar no código. Por isso o sistema tem um único *motor* (renderizador de quiz, motor de regras,
renderizador de página de vendas, sistema de eventos) e cada campanha é apenas **um documento de
configuração** persistido no banco.

Decisões principais:

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router) + TypeScript | Admin, API e páginas públicas no mesmo deploy (Vercel). |
| Banco | PostgreSQL (Neon) via `postgres` (postgres.js) + Drizzle ORM | Mesmo driver funciona local e no Neon (URL com pooler). |
| Configuração da campanha | Documento JSONB validado por Zod (`campaigns.config`) | Duplicar campanha, salvar como modelo e versionar = copiar um documento. Evita dezenas de tabelas e joins para conteúdo que é sempre lido inteiro. |
| Publicação | `config` (rascunho) × `published_config` (snapshot publicado) | Editar o rascunho nunca quebra a campanha no ar. "Publicar" copia o rascunho validado. |
| Dados analíticos | Tabelas normalizadas (`visitor_sessions`, `events`, `leads`, `purchases`, `ad_spend`) | Agregações SQL rápidas e auditáveis; nenhuma métrica é inventada. |
| Motor de regras | Função pura TypeScript, executada **no servidor** | Testável isoladamente; regras e pontuações não são expostas ao visitante. |
| Autenticação | Sessões próprias (token aleatório, hash SHA-256 no banco, cookie httpOnly) + senha com `scrypt` | Sem dependência externa, adequado a um painel privado; papéis `owner`, `editor`, `viewer`. |
| UI | Tailwind CSS v4 + componentes no padrão shadcn/ui (Radix) | Visual sóbrio estilo Linear/Vercel. |
| Gráficos | Recharts | Estável e leve o suficiente. |
| Drag and drop | dnd-kit | Reordenar perguntas e blocos. |
| Testes | Vitest (unidade + integração contra PostgreSQL real) | Cobre regras, cálculo de métricas, fluxos de serviço. |

### Separação de camadas

```
src/
  app/(admin)/...            Interface administrativa (Server Components + Server Actions)
  app/(auth)/...             Login e configuração inicial
  app/q/[slug]/...           Renderização pública (quiz, resultado, oferta)
  app/api/public/...         API pública (rate limited) — sessão, respostas, conclusão, lead, checkout
  app/api/webhooks/...       Confirmação de vendas (assinatura validada)
  lib/db/                    Schema Drizzle e conexão
  lib/domain/                Schemas Zod da configuração (contrato único entre editor, API e renderizadores)
  lib/engine/                Motor de atributos e regras (puro, sem I/O)
  lib/analytics/             Cálculo de métricas (puro) + consultas SQL
  lib/services/              Regras de negócio com acesso ao banco
  lib/integrations/          Adaptadores de checkout (genérico, Hotmart, Kiwify) e webhooks de saída
  lib/security/              Rate limiting, sanitização, auth
  components/ui/             Design system
  components/admin/          Editores (quiz, regras, resultados, página de vendas)
  components/public/         QuizRunner e SalesPageRenderer
```

## 2. Modelo de banco de dados

```
users            id, email (único), name, password_hash, role, created_at
auth_sessions    id (sha256 do token), user_id → users, expires_at, created_at
products         id, name, cover_image_url, description, category, price_cents,
                 reference_price_cents, reference_price_note, checkout_url,
                 benefits jsonb, deliverables jsonb, bonuses jsonb, guarantee, status, timestamps
campaigns        id, name, description, slug (único), status (draft|published|paused|archived),
                 product_id → products, config jsonb (rascunho), published_config jsonb,
                 published_at, created_at, updated_at
templates        id, name, description, category, config jsonb, is_builtin, created_at
visitor_sessions id, campaign_id, visitor_id, utm_* , referrer, traffic_source, device,
                 answers jsonb, attributes jsonb, score, profile_id, started_at, completed_at, created_at
events           id, campaign_id, session_id, visitor_id, type, question_id, profile_id,
                 value_cents, utm_*, traffic_source, device, metadata jsonb, created_at
leads            id, campaign_id, session_id, name, email, consent, consent_text, consent_at,
                 created_at, deleted_at (exclusão = anonimização)
purchases        id, campaign_id, session_id, provider, external_id, status, amount_cents,
                 currency, profile_id, raw jsonb, confirmed_at, created_at  — único (provider, external_id)
ad_spend         id, campaign_id, date, amount_cents, source, note
webhook_endpoints id, provider, name, secret, campaign_id (opcional), active, last_received_at
settings         key, value jsonb  (pixel global, GA, GTM, política de privacidade, webhook de saída)
```

### Documento de configuração (`CampaignConfig`)

```
theme        cores, fonte, raio, espaçamento do quiz
quiz         intro, perguntas[], configurações (barra de progresso, voltar, mensagem de transição)
  question   id, type (single|multiple|text|number|range|yes_no), título, descrição, imagem,
             obrigatória, opções[], attributeKey, min/max/step, transição
  option     id, label, value, score, attributes { chave: valor }
profiles     perfis/resultados configuráveis (sem limite) — um marcado como padrão
rules        regras ordenadas: grupo de condições (AND/OR aninhável) → perfil
offer        preço, preço de referência + justificativa, descrição, benefícios, bônus,
             condições de pagamento, checkout, texto do botão
salesPage    tema + blocos[] (cada bloco pode ser restrito a perfis)
leadCapture  desativado | antes do resultado | depois do resultado, obrigatório?, consentimento
tracking     Meta Pixel, GA4, GTM (sobrescrevem as configurações globais)
```

## 3. Métricas (definições usadas no código)

- Visitantes únicos = `COUNT(DISTINCT visitor_id)` em `page_view`
- Taxa de início = quizzes iniciados / visitantes únicos
- Taxa de conclusão = quizzes concluídos / quizzes iniciados
- Taxa de compra = compras **confirmadas** / visitantes únicos
- CPA = investimento em anúncios / compras confirmadas
- ROAS = receita confirmada atribuída / investimento em anúncios
- Receita por visitante = receita confirmada / visitantes únicos
- Abandono por pergunta = sessões que responderam a pergunta *n−1* e não responderam *n*

`checkout_clicked` **nunca** conta como venda. Vendas só nascem de webhook com assinatura validada
(ou de registro manual explícito pelo administrador, marcado como `provider = manual`).
Divisões por zero retornam `null` e são exibidas como "—".

## 4. Fases

| Fase | Entregas |
|---|---|
| 1 — Fundação | Projeto, schema + migrações, autenticação/papéis, layout admin, dashboard, produtos, campanhas (CRUD, duplicar, arquivar, status) |
| 2 — Quiz Builder | Editor de perguntas (6 tipos), drag and drop, opções com pontuação/atributos, preview em tempo real, publicação, URL pública `/q/[slug]` |
| 3 — Personalização | Atributos, motor de regras AND/OR, perfis ilimitados, resultado padrão, editor de resultados |
| 4 — Vendas | Editor de página de vendas por blocos, tema, visibilidade por perfil, preview desktop/mobile, ofertas, checkout externo rastreado |
| 5 — Analytics | Eventos, funil, abandono por pergunta, UTMs, origem, perfil, investimento em anúncios, Meta Pixel/GA/GTM sem PII |
| 6 — Evolução | Modelos prontos, salvar como modelo, webhooks de compra (genérico/Hotmart/Kiwify), webhook de saída, leads/LGPD |

Fora do MVP (próximos passos): testes A/B com divisão de tráfego, upload de imagens próprio
(hoje via URL), rate limiting distribuído (Upstash/Redis), equipe multi-tenant.

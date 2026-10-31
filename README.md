# FunnelOS

Plataforma privada para criar, publicar e analisar funis de vendas baseados em quizzes.
Cada campanha é um documento de configuração (quiz, perfis, regras, oferta, página de vendas,
captura de leads e rastreamento) interpretado por um único motor — nenhuma pergunta ou resultado
fica no código.

Plano técnico, modelo de dados e definições de métricas: [`docs/PLANO_TECNICO.md`](docs/PLANO_TECNICO.md).

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · componentes no padrão shadcn/ui (Radix) ·
PostgreSQL (Neon) · Drizzle ORM · Zod · Recharts · dnd-kit · Vitest.

## Rodando localmente

```bash
cp .env.example .env          # ajuste DATABASE_URL
npm install
npm run db:migrate            # cria as tabelas
npm run db:seed               # instala os 6 modelos prontos
npm run dev
```

Abra `http://localhost:3000/setup` para criar o primeiro administrador (só funciona enquanto não
houver usuários; defina `SETUP_TOKEN` para exigir um token). Alternativa via terminal:

```bash
npm run admin:create -- voce@exemplo.com "senha-com-10+-caracteres" "Seu nome"
```

## Testes

```bash
npm test                      # unidade + integração (usa o banco funnelos_test; TEST_DATABASE_URL para mudar)
```

Cobrem: cadastro de produto, criação/duplicação/publicação de campanha, validação do quiz, envio de
respostas, motor de regras (AND/OR, pontuação, padrão), resultado, lead/LGPD, clique no checkout,
webhooks (genérico, Hotmart, Kiwify), registro de eventos e cálculo das métricas.

Teste end-to-end no navegador (fluxo completo do briefing: produto → campanha → quiz → regras →
página de vendas → publicar → visitante → lead → checkout → venda por webhook → métricas):

```bash
npm run build && npm start &
BASE_URL=http://localhost:3000 node e2e/flow.mjs   # requer Playwright e banco com modelos instalados
```

## Deploy (Vercel + Neon)

1. Na Vercel: **Storage → Create Database → Neon** e conecte ao projeto (cria `DATABASE_URL` automaticamente).
   Ou crie o banco em neon.tech e adicione `DATABASE_URL` (connection string *pooled*) em Settings → Environment Variables.
2. Adicione `APP_SECRET` (string aleatória longa). Opcionais: `SETUP_TOKEN` (protege `/setup`) e
   `NEXT_PUBLIC_APP_URL` (domínio próprio; sem ela usa o domínio de produção da Vercel).
3. Faça um novo deploy. O build (`scripts/prebuild.ts`) aplica as migrações e instala os modelos prontos.
4. Acesse `/setup` e crie o administrador.

## Como funciona

- **Rascunho × publicado**: os editores salvam em `campaigns.config`. “Publicar” valida e copia para
  `published_config`, que é o que os visitantes veem em `/q/<slug>`. Editar nunca quebra a campanha no ar.
- **Motor de regras** (`src/lib/engine`): respostas → atributos/pontuação → regras na ordem configurada →
  primeira atendida define o perfil; senão, o perfil padrão. Executado no servidor; regras e pontuações
  não chegam ao navegador.
- **Eventos** (`page_view`, `quiz_started`, `question_answered`, `quiz_completed`, `result_viewed`,
  `offer_viewed`, `checkout_clicked`, `purchase_confirmed`, `lead_captured`) com sessão, UTMs, origem e
  dispositivo. Métricas vêm só desses eventos e da tabela de vendas.
- **Vendas**: clique no checkout nunca é venda. Vendas entram por webhook validado (Integrações) ou por
  registro manual explícito do proprietário. A sessão segue para o checkout em `sck`/`src`/`fos_sid`
  para atribuir a venda à campanha, ao perfil e à origem.
- **Pixels**: Meta Pixel / GA4 / GTM globais ou por campanha, sem dados pessoais nos eventos.
- **Papéis**: proprietário (tudo), editor (campanhas/produtos/modelos), leitura.

## Estado das fases

| Fase | Status |
|---|---|
| 1 — Fundação (banco, auth, dashboard, produtos, campanhas) | ✅ |
| 2 — Quiz Builder (6 tipos, drag and drop, preview, publicação, URL pública) | ✅ |
| 3 — Personalização (atributos, regras AND/OR aninhadas, perfis ilimitados, resultado padrão) | ✅ |
| 4 — Vendas (editor de blocos, visibilidade por perfil, preview mobile/desktop, oferta, checkout rastreado) | ✅ |
| 5 — Analytics (funil, abandono por pergunta, perfil, origem, dispositivo, UTMs, CPA/ROAS, pixels) | ✅ |
| 6 — Evolução (modelos, salvar como modelo, duplicação, webhooks de entrada/saída, LGPD) | ✅ parcial |

**Ainda não implementado** (próximos passos): testes A/B com divisão de tráfego; upload de imagens
(hoje por URL); rate limiting distribuído (o atual é em memória por instância — trocar por Upstash Redis
em `src/lib/security/rate-limit.ts`); importação automática de investimento das plataformas de anúncio
(hoje lançado manualmente). Os mapeamentos de Hotmart/Kiwify seguem a documentação pública dos
webhooks — valide com um evento de teste da plataforma antes de usar em produção.

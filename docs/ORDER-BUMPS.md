# Order bumps do ROTA INVISÍVEL

São dois complementos **reais e entregáveis**, que **não repetem** o que já está no guia e nos 4 bônus. Os dois aparecem no checkout da Kiwify como uma caixa para marcar ("Sim, quero adicionar").

| | Bump 1 | Bump 2 |
|---|---|---|
| Produto | **Calculadora de Preço e Lucro** | **Kit de Divulgação Pronto** |
| O que é | Planilha .xlsx com fórmulas (4 abas) + guia rápido em PDF | PDF com 30 legendas, 20 status, 6 bios, mensagens automáticas, 4 roteiros e modelo de catálogo |
| Por que complementa | O guia ensina a fórmula do preço (Cap. 4); a planilha faz a conta | O guia de clientes ensina a conversar; o kit ensina a ser lembrado |
| Preço sugerido | **R$ 9,90** | **R$ 12,90** |
| Link de acesso (entrega) | `https://rotainvisivel.vercel.app/acesso/calculadora-preco-cexjcg6epw/` | `https://rotainvisivel.vercel.app/acesso/kit-divulgacao-zyuukvr6xb/` |
| Imagem do bump | `marketing/order-bumps/png/bump-1-calculadora.png` | `marketing/order-bumps/png/bump-2-kit-divulgacao.png` |

Os dois preços ficam abaixo do produto principal (R$ 19,90), o que costuma facilitar a decisão por impulso. Juntos, o pedido completo vai a R$ 42,70. Não há preço riscado nem "de/por": o preço é o preço.

## Textos para colar na Kiwify

### Bump 1 — Calculadora de Preço e Lucro
- **Chamada (botão/checkbox):** Sim, quero adicionar a calculadora
- **Título:** Calculadora de Preço e Lucro
- **Descrição:** Planilha pronta que calcula o preço certo do seu produto ou serviço, o lucro de cada venda e quanto sobrou no mês. Funciona no Excel, no Google Planilhas e no celular. Acompanha guia rápido com 3 exemplos.

### Bump 2 — Kit de Divulgação Pronto
- **Chamada:** Sim, quero adicionar o kit de divulgação
- **Título:** Kit de Divulgação Pronto
- **Descrição:** 30 legendas em calendário, 20 textos para status e stories, 6 modelos de bio, mensagens automáticas do WhatsApp Business e 4 roteiros de vídeo curto. É só trocar os colchetes pelas suas informações e postar.

## Passo a passo na Kiwify

1. **Criar os 2 produtos** (Produtos → Criar produto), um para cada bump, como produto digital:
   - Nome, preço e imagem conforme a tabela acima.
   - **Entrega:** área de membros da Kiwify com o link de acesso da tabela, ou "link externo" apontando para ele. O link é privado: só quem compra recebe.
2. **Abrir o produto Rota Invisível** → configurações do checkout → **Order bump** → adicionar os 2 produtos, com os textos acima e as imagens.
3. **Webhook do FunnelOS:** deixe o webhook marcado **apenas no produto Rota Invisível**, e não nos bumps. Assim:
   - cada pedido conta uma vez no contador de compradores;
   - o valor total do pedido (com bumps) entra no faturamento, se a Kiwify o enviar no evento do produto principal.

   Depois da primeira venda com bump, compare o valor no FunnelOS (Analytics → últimas vendas) com o da Kiwify.
4. **Pixel da Meta:** nada muda. O Purchase continua sendo enviado pela Kiwify, com o valor total do pedido.
5. Faça um **teste de visualização** do checkout (sem pagar) para ver as caixas dos bumps no celular.

## Arquivos

- Conteúdo: `ebook/content/bump-calculadora-preco.md` e `ebook/content/bump-kit-divulgacao.md`.
- Planilha: `ebook/planilha.py`, que gera o .xlsx com fórmulas. Os exemplos batem com o guia: bolo de pote R$ 10,00, faxina R$ 182,40 e acessório com R$ 7,81 de lucro.
- Gerar tudo de novo: `npm run ebook:build`. Isso gera o produto principal e os 2 bumps, cada um na sua pasta em `public/acesso/`.
- Imagens dos bumps: `node marketing/order-bumps/gerar.mjs`.

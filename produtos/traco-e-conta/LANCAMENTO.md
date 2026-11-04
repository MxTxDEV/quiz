# Traço & Conta: guia de lançamento

Kit **original** de atividades para imprimir: alfabetização e matemática, de 4 a 8 anos. Todo o conteúdo foi gerado do zero para esta marca:
- textos, layouts e atividades próprios;
- figuras: emojis Noto, de código aberto;
- fontes: Fredoka e Nunito (licença OFL).

Nada foi copiado da oferta de referência. Dela, só o formato de low ticket inspirou a estrutura.

## O que existe

| Item | Onde |
|---|---|
| Página de vendas | `public/traco-e-conta/index.html`, no ar em `https://rotainvisivel.vercel.app/traco-e-conta` |
| Configuração da página (pixel e checkouts) | `public/traco-e-conta/config.js` |
| Kit Básico: 16 PDFs + gabarito | `https://rotainvisivel.vercel.app/acesso/traco-e-conta-basico-r7m2k9wq/` |
| 5 apostilas bônus + gabarito | `https://rotainvisivel.vercel.app/acesso/traco-e-conta-bonus-x4p8n3vd/` |
| Kit Completo: Básico + bônus, em uma página | `https://rotainvisivel.vercel.app/acesso/traco-e-conta-completo-h6t9c2ja/` |
| Logo, ícone, foto de perfil, capas | `produtos/traco-e-conta/marca/` |
| 8 criativos (feed 4:5 e stories 9:16) | `marketing/meta-ads/traco-e-conta/png/` |
| Gerar tudo de novo | `node produtos/traco-e-conta/gerar.mjs`, depois `marca.mjs`, depois `node marketing/meta-ads/traco-e-conta/gerar.mjs` |

**Conteúdo do Kit Básico: 280 atividades**

| Módulo | Atividades |
|---|---|
| Coordenação motora | 24 |
| Alfabeto | 28 |
| Famílias silábicas | 32 |
| Separação silábica | 10 |
| Sílabas complexas | 12 |
| Ortografia | 14 |
| Leitura e interpretação | 20 |
| Escrita | 16 |
| Números de 0 a 20 | 21 |
| Quantidades | 12 |
| Adição e subtração | 23 |
| Lógica | 12 |
| Formas | 8 |
| Labirintos | 20 |
| Caça-palavras | 16 |
| Desenho no quadriculado | 12 |

O gabarito vem à parte, com 9 páginas.

**Bônus: 50 páginas**

| Apostila | Páginas |
|---|---|
| Inglês ilustrado | 12 |
| Dinheirinho | 10 |
| Horas e calendário | 8 |
| Sondagem de escrita | 6 |
| Parede da sala e certificados | 14 |

## Preços e estrutura da oferta

| Produto na Kiwify | Preço | Entrega (link de acesso) |
|---|---|---|
| **Kit Traço & Conta — Básico** | R$ 10,00 | pasta `traco-e-conta-basico-…` |
| **Kit Traço & Conta — Completo** | R$ 17,90 | pasta `traco-e-conta-completo-…` |
| **5 apostilas bônus** (order bump no checkout do Básico) | R$ 7,90 | pasta `traco-e-conta-bonus-…` |

- Quem clica em "Quero o Básico" na página vê o pop-up "Por R$ 7,90 a mais, leve as 5 apostilas bônus". O "sim" leva ao checkout do Completo e o "não" ao do Básico.
- Quem segue no Básico ainda vê, no checkout, o order bump das 5 apostilas por R$ 7,90.
- Nos dois caminhos, o valor final é o mesmo: R$ 17,90.

**O que esta oferta não usa, embora a referência use:**
- **Preço riscado** ("De R$ 39,90"): o produto nunca foi vendido por esse valor.
- **Contador regressivo e "somente agora":** não existe prazo real.
- **"Mais de 1.000 professores" e conversas de WhatsApp:** não há compradores ainda.
- **"+10.000 atividades":** o kit tem 280.
- **"Material para autismo e TDAH":** exigiria adaptação feita por especialista.

Além do risco legal (CDC, art. 37) e de reprovação no Meta, essas práticas geram reembolso quando a pessoa abre o arquivo. Quando houver vendas, peça avaliações reais e coloque na página.

## Passo a passo na Kiwify

1. **Criar o produto "Kit Traço & Conta — Básico"** (digital, R$ 10,00).
   - Imagem: `marca/capa-kit-basico.png`.
   - Entrega: área de membros da Kiwify ou "link externo" com o link da pasta básico.
2. **Criar o "Kit Traço & Conta — Completo"** (R$ 17,90).
   - Imagem: `marca/capa-kit-completo.png`.
   - Entrega: link da pasta completo.
3. **Criar o "5 apostilas bônus"** (R$ 7,90).
   - Imagem: `marca/capa-bonus.png`.
   - Entrega: link da pasta bônus.
4. **No produto Básico → Order bump:** adicionar o produto "5 apostilas bônus".
   - Chamada: *"Sim, quero as 5 apostilas bônus"*.
   - Descrição: *"Inglês ilustrado, dinheirinho, horas e calendário, sondagem de escrita e material de parede com certificados. 50 páginas para imprimir."*
5. **Pixel:** crie um conjunto de dados (pixel) novo no Meta só para esta marca e configure o Purchase na Kiwify, só para pagamento aprovado, nos 3 produtos.
6. **Colar em `public/traco-e-conta/config.js`:** o ID do pixel e os 2 links de checkout (Básico e Completo). Depois é só fazer commit, ou me mandar que eu atualizo.

## Domínio próprio (recomendado)

A página funciona em `rotainvisivel.vercel.app/traco-e-conta`, mas o endereço não combina com a marca, e isso pesa na confiança e no anúncio. O ideal:
- registrar `tracoeconta.com.br`, ou outro nome livre;
- apontar o domínio na Vercel e pedir a regra de redirecionamento para a página. Eu deixo pronto.

## Criativos e textos dos anúncios

Envie os dois formatos no mesmo anúncio ("Personalizar posicionamentos"). **Link:** a página de vendas, com o parâmetro `?utm_source=meta&utm_medium=paid&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`. **Botão:** "Comprar agora" ou "Saiba mais".

| Criativo | Texto principal | Título |
|---|---|---|
| **TC01 · 280 atividades** | 280 atividades de alfabetização e matemática prontas para imprimir: letras, sílabas, leitura, números, continhas e labirintos. Para crianças de 4 a 8 anos. PDF com gabarito, acesso imediato por R$ 10. | 280 atividades por R$ 10 |
| **TC02 · Veja por dentro** | As folhas da imagem são do kit, do jeito que você vai imprimir. São 16 módulos organizados por tema, do traçado das letras à leitura de textos curtos. | Veja as atividades por dentro |
| **TC03 · Planejamento pronto** | Atividades organizadas por tema para a semana inteira: escolha o módulo, imprima e aplique. Alfabeto, sílabas, ortografia, números, continhas, caça-palavras e mais. | Planejamento pronto em 5 minutos |
| **TC04 · Do A ao Z** | Do traçado das letras às primeiras leituras: alfabeto de A a Z, famílias silábicas, sílabas complexas, ortografia e 20 textos curtos com perguntas. | Do A ao Z, da letra à leitura |
| **TC05 · Continhas** | Contar, juntar, tirar, completar sequências e resolver probleminhas, com figuras e muitas cores. Gabarito incluso para corrigir rápido. | Continhas que parecem brincadeira |
| **TC06 · Menos tela** | Atividades curtas e coloridas para fazer à mesa, em casa ou na escola: traçados, labirintos, desenho no quadriculado e muito mais. | Menos tela, mais lápis |
| **TC07 · Imprima quantas vezes** | Você paga uma vez e imprime quantas vezes precisar, para casa ou para a turma inteira. PDF em folha A4, bom também em preto e branco. | Pague uma vez, imprima sempre |
| **TC08 · Kit Completo** | As 280 atividades e mais 5 apostilas bônus: inglês ilustrado, dinheirinho, horas e calendário, sondagem de escrita e material de parede com certificados. R$ 17,90. | 280 atividades + 5 bônus |

**Teste sugerido:**
- 1 campanha de vendas e 1 conjunto aberto, com todo o Brasil, mulheres e homens de 25 a 55 anos (o Advantage+ ajusta), e os 8 anúncios;
- de R$ 20 a R$ 30 por dia durante 3 a 4 dias, antes de julgar;
- depois, desligar os anúncios com CTR baixo e duplicar os 2 ou 3 melhores.

**Meta de viabilidade:** o ticket médio fica entre R$ 10 e R$ 17,90. Para lucrar, o custo por compra precisa ficar abaixo do ticket médio. Acompanhe pelo gerenciador e pela Kiwify.

## Criativos v4 (foto em destaque, outros ângulos) — `marketing/meta-ads/traco-e-conta/png-v4/`

| Criativo | Ângulo | Texto principal sugerido |
|---|---|---|
| A · Menos tela | Tempo juntos | Que tal trocar um pouco de tela por lápis e papel? São 280 atividades para fazer junto com seu filho: letras, sílabas, números, labirintos e muito mais. PDF para imprimir, por R$ 10. |
| B · Ler e escrever | Alfabetização | Do traçado das letras às primeiras leituras: alfabeto, famílias silábicas, ortografia e 20 textos curtos com perguntas. Atividades para fazer em casa, com gabarito. R$ 10. |
| C · Reforço | Reforço escolar | O que a escola ensina, praticado em casa no ritmo da criança. 280 atividades de alfabetização e matemática, organizadas por tema, prontas para imprimir. |
| D · Imprima hoje | Conveniência | O acesso chega no seu e-mail logo após o pagamento. É só baixar o PDF, imprimir e usar ainda hoje. 280 atividades por R$ 10. |
| E · 280 por R$ 10 | Preço | São 280 atividades por R$ 10: menos de 4 centavos por folha. Alfabetização e matemática para crianças de 4 a 8 anos, com gabarito. |
| F · 1, 2, 3... | Matemática | Contar, juntar, tirar e completar sequências com figuras e cores. Matemática que parece brincadeira, para fazer junto. 280 atividades por R$ 10. |
| G · +5 bônus | Kit Completo | As 280 atividades e mais 5 apostilas bônus: inglês ilustrado, dinheirinho, horas, sondagem de escrita e material de parede. R$ 17,90. |

Título sugerido para todos: **280 atividades para imprimir por R$ 10** (G: **280 atividades + 5 bônus por R$ 17,90**).

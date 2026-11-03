// 10 criativos de venda direta do ROTA INVISÍVEL — feed 4:5 (1080×1350) e stories/reels 9:16 (1080×1920).
// Ângulos diferentes, só com afirmações que o produto cumpre (sem promessa de ganho, sem escassez falsa,
// sem depoimento inventado) e frases gerais — o Meta proíbe insinuar a situação financeira de quem vê o anúncio.
// Uso: node marketing/meta-ads/criativos-v2/gerar.mjs
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
const { chromium } = createRequire(import.meta.url)("playwright");

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.resolve(here, "../../..");
const out = path.join(here, "png");
mkdirSync(out, { recursive: true });
// data URI: o setContent roda em about:blank, onde file:// é bloqueado
const img = (f) => `data:image/jpeg;base64,${readFileSync(path.join(root, "public/produto/previa", f)).toString("base64")}`;

// ---------------------------------------------------------------- peças visuais
const route = `<svg class="route" viewBox="0 0 100 133" preserveAspectRatio="none"><path d="M-5 92 C 14 86, 24 70, 44 68 S 68 56, 72 40 S 90 18, 110 12" fill="none" stroke="#ff6b00" stroke-width="1" stroke-dasharray="2.6 2.6"/><circle cx="72" cy="40" r="2.2" fill="#ff6b00"/><circle cx="72" cy="40" r="5" fill="none" stroke="#ff6b00" stroke-opacity=".35" stroke-width=".7"/></svg>`;
const book = (w, title = "Rota Invisível", label = "Guia prático", tilt = -22) => `
  <div class="book" style="width:${w}px;--bw:${w}px;transform:perspective(1600px) rotateY(${tilt}deg) rotateX(4deg)">
    <div class="pages"></div>
    <div class="cover">${route}<div class="bar"></div><div class="bt"><div class="bl">${label}</div><div class="bn">${title}</div></div><div class="shine"></div></div>
  </div>`;
const hero = (w) => `<div class="aura" style="width:${w * 2.1}px;height:${w * 2.1}px"></div>${book(w)}`;
const brand = `<div class="brand">Rota <span>Invisível</span></div>`;
const cta = (txt = "Quero meu acesso") => `<div class="ctaRow"><span class="cta">${txt} <b>→</b></span><span class="price"><s></s>R$ 19,90<small>pagamento único</small></span></div>`;
const legal = `<div class="legal">Produto educativo. Resultados dependem da sua dedicação e não são garantidos.</div>`;
const page = (src, w, rot = 0, h = null) => `<div class="sheet" style="width:${w}px;${h ? `height:${h}px;` : ""}transform:rotate(${rot}deg)"><img src="${src}"><i class="fade"></i><span class="tag">Trecho real</span></div>`;

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: var(--w); height: var(--h); background: #09090a; color: #fff; font-family: "Inter Display", Inter, "Helvetica Neue", Arial, sans-serif; overflow: hidden; position: relative; }
.bg { position: absolute; inset: 0; background: radial-gradient(70% 45% at 85% 30%, rgba(255,107,0,.20), transparent 70%), radial-gradient(60% 40% at 0% 100%, rgba(255,107,0,.12), transparent 70%); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 54px 54px; -webkit-mask-image: linear-gradient(180deg, #000, transparent 85%); }
.wrap { position: absolute; inset: 0; padding: var(--pt) 72px var(--pb); display: flex; flex-direction: column; gap: 0; }
.brand { font-family: Inter; font-weight: 900; letter-spacing: .18em; font-size: 24px; text-transform: uppercase; }
.brand span { color: #ff6b00; }
.eyebrow { display: inline-flex; align-self: flex-start; align-items: center; gap: 10px; color: #ff6b00; font-family: Inter; font-weight: 800; letter-spacing: .18em; text-transform: uppercase; font-size: 22px; border: 2px solid rgba(255,107,0,.45); border-radius: 999px; padding: 10px 20px; }
h1 { font-weight: 900; letter-spacing: -.04em; line-height: .98; }
h1 em { font-style: normal; color: #ff6b00; }
h1 mark { background: #ff6b00; color: #09090a; padding: 0 .12em; border-radius: .12em; box-decoration-break: clone; -webkit-box-decoration-break: clone; }
.sub { font-family: Inter; color: #b9b9c2; line-height: 1.34; font-weight: 500; }
.sub b { color: #fff; }
.ctaRow { display: flex; align-items: center; gap: 26px; }
.cta { display: inline-flex; align-items: center; gap: 14px; background: #ff6b00; color: #09090a; font-family: Inter; font-weight: 900; text-transform: uppercase; letter-spacing: .02em; border-radius: 18px; box-shadow: 0 22px 50px -18px rgba(255,107,0,.85), inset 0 -4px 0 rgba(0,0,0,.18); font-size: 32px; padding: 28px 38px; }
.price { display: flex; flex-direction: column; font-weight: 900; font-size: 46px; letter-spacing: -.03em; line-height: 1; }
.price small { font-family: Inter; font-size: 18px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #8b8b95; margin-top: 8px; }
.legal { font-family: Inter; color: #5f5f68; font-size: 17px; letter-spacing: .02em; margin-top: 22px; }
.aura { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 50%; background: radial-gradient(circle, rgba(255,140,40,.55), rgba(255,107,0,.18) 40%, transparent 68%); filter: blur(6px); }
.bookStage { position: relative; display: grid; place-items: center; }
.book { position: relative; aspect-ratio: 3/4; transform-style: preserve-3d; }
.book .pages { position: absolute; top: 2%; bottom: 2%; right: -4%; width: 7%; background: repeating-linear-gradient(90deg,#ececec 0 2px,#cdcdcd 2px 3px); transform: rotateY(60deg); transform-origin: left; }
.book .cover { position: absolute; inset: 0; background: #0d0d0f; border: 1px solid rgba(255,255,255,.12); border-radius: 4px 12px 12px 4px; overflow: hidden; box-shadow: inset 8px 0 14px -8px rgba(255,255,255,.35), 34px 50px 90px -24px rgba(0,0,0,.95), 0 0 0 2px rgba(255,107,0,.35), 0 0 60px -10px rgba(255,107,0,.7); display: flex; flex-direction: column; justify-content: space-between; padding: 9%; }
.book .route { position: absolute; inset: 0; width: 100%; height: 100%; }
.book .bar { position: relative; width: 30%; height: calc(var(--bw) * .014); background: #ff6b00; }
.book .bt { position: relative; }
.book .bl { color: #ff6b00; font-family: Inter; font-weight: 800; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 6%; font-size: calc(var(--bw) * .045); }
.book .bn { font-weight: 900; text-transform: uppercase; line-height: .93; letter-spacing: -.01em; font-size: calc(var(--bw) * .13); }
.book .shine { position: absolute; top: -10%; bottom: -10%; left: 30%; width: 28%; background: linear-gradient(100deg, transparent, rgba(255,255,255,.14), transparent); transform: skewX(-12deg); }
.sheet { position: relative; background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 40px 80px -30px rgba(0,0,0,.95), 0 0 0 1px rgba(255,255,255,.08); }
.sheet img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: top; }
.sheet .fade { position: absolute; left: 0; right: 0; bottom: 0; height: 30%; background: linear-gradient(transparent, #fff 85%); }
.sheet .tag { position: absolute; left: 16px; bottom: 14px; background: #ff6b00; color: #09090a; font-family: Inter; font-weight: 900; font-size: 18px; letter-spacing: .12em; text-transform: uppercase; padding: 8px 14px; border-radius: 999px; }
.check { display: flex; align-items: center; gap: 18px; font-family: Inter; font-weight: 700; }
.check i { width: 1.5em; height: 1.5em; border-radius: 50%; background: #ff6b00; color: #09090a; display: grid; place-items: center; font-style: normal; font-weight: 900; flex-shrink: 0; font-size: .8em; }
.row { display: flex; align-items: center; justify-content: space-between; gap: 16px; background: #141416; border: 1px solid rgba(255,255,255,.08); border-radius: 18px; padding: 20px 24px; font-family: Inter; font-weight: 700; }
.row small { color: #ff6b00; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; font-size: .62em; white-space: nowrap; border: 2px solid rgba(255,107,0,.45); border-radius: 999px; padding: 6px 12px; }
.card { background: #141416; border: 1px solid rgba(255,255,255,.09); border-radius: 22px; padding: 24px 26px; font-family: Inter; }
.card .k { color: #ff6b00; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; font-size: 19px; }
.card .t { font-family: "Inter Display"; font-weight: 900; font-size: 35px; letter-spacing: -.02em; margin-top: 6px; }
.card .d { color: #b4b4bd; font-size: 24px; margin-top: 8px; line-height: 1.3; }
.pill { display: inline-flex; align-items: center; gap: 10px; background: rgba(255,107,0,.16); color: #ff8a2a; font-family: Inter; font-weight: 800; border-radius: 999px; padding: 12px 20px; font-size: 25px; }
.chat { background: #0b141a; border-radius: 28px; padding: 28px; font-family: Inter; box-shadow: 0 40px 80px -30px #000; border: 1px solid rgba(255,255,255,.08); }
.chat .hd { display: flex; align-items: center; gap: 14px; color: #e9edef; font-weight: 800; font-size: 24px; padding-bottom: 18px; border-bottom: 1px solid rgba(255,255,255,.08); }
.chat .hd i { width: 46px; height: 46px; border-radius: 50%; background: #2a3942; display: grid; place-items: center; font-style: normal; }
.bubble { background: #005c4b; color: #e9edef; border-radius: 18px 18px 4px 18px; padding: 20px 22px; font-size: 28px; line-height: 1.38; margin-top: 20px; margin-left: 60px; position: relative; }
.bubble em { font-style: normal; color: #ffd29a; font-weight: 700; }
.bubble .tm { display: block; text-align: right; color: #8fbfb3; font-size: 16px; margin-top: 6px; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.col { background: #141416; border: 1px solid rgba(255,255,255,.09); border-radius: 24px; padding: 26px; font-family: Inter; }
.col h3 { font-family: "Inter Display"; font-weight: 900; font-size: 38px; letter-spacing: -.02em; }
.col h3 span { color: #ff6b00; }
.col li { list-style: none; font-size: 27px; font-weight: 600; color: #d7d7de; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.07); }
.col li:last-child { border: 0; }
.col li b { color: #ff6b00; font-weight: 900; font-size: 21px; margin-left: 8px; }
.weeks { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.wk { background: #141416; border: 1px solid rgba(255,255,255,.09); border-radius: 20px; padding: 22px 18px; font-family: Inter; text-align: center; }
.wk b { display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 14px; border-radius: 50%; background: #ff6b00; color: #09090a; font-weight: 900; font-size: 24px; box-shadow: 0 0 30px -4px rgba(255,107,0,.8); }
.wk span { font-weight: 900; font-size: 27px; display: block; }
.wk small { color: #a4a4ae; font-size: 20px; display: block; margin-top: 6px; line-height: 1.25; }
.ideas { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 16px; font-family: Inter; }
.ideas div { display: flex; gap: 12px; align-items: center; font-size: 27px; font-weight: 700; color: #e4e4ea; background: #131315; border: 1px solid rgba(255,255,255,.07); border-radius: 14px; padding: 14px 16px; }
.ideas div b { color: #ff6b00; font-weight: 900; font-size: 21px; }
.vs { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-family: Inter; }
.vs .yes, .vs .no { border-radius: 22px; padding: 24px; }
.vs .yes { background: rgba(255,107,0,.1); border: 2px solid rgba(255,107,0,.5); }
.vs .no { background: #141416; border: 1px solid rgba(255,255,255,.09); color: #9a9aa5; }
.vs h3 { font-family: "Inter Display"; font-weight: 900; font-size: 33px; margin-bottom: 10px; color: #fff; }
.vs p { font-size: 26px; font-weight: 600; padding: 9px 0; line-height: 1.25; }
`;

// ---------------------------------------------------------------- os 10 ângulos
// f = true → feed 4:5; false → stories 9:16 (mais altura, mesmo conteúdo, zonas seguras respeitadas)
const ads = [
  {
    id: "01-direcao",
    nome: "Falta direção",
    html: (f) => `
      ${brand}
      <div style="margin-top:${f ? 46 : 70}px"><span class="eyebrow">Para quem quer uma renda extra</span></div>
      <h1 style="font-size:${f ? 98 : 110}px;margin-top:30px">Não falta vontade.<br><em>Falta direção.</em></h1>
      <p class="sub" style="font-size:${f ? 32 : 36}px;margin-top:26px;max-width:880px">Um guia prático com <b>30 ideias</b>, <b>scripts para os primeiros clientes</b> e um <b>plano de 30 dias</b>.</p>
      <div class="bookStage" style="flex:1">${hero(f ? 300 : 400)}</div>
      ${cta()}${legal}`,
  },
  {
    id: "02-veja-por-dentro",
    nome: "Prova: veja por dentro",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 92 : 104}px;margin-top:${f ? 40 : 64}px">Veja por dentro<br><em>antes de comprar.</em></h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:20px">Trechos reais do guia e dos bônus. Nada de promessa vazia.</p>
      <div style="flex:1;position:relative;margin-top:24px">
        <div style="position:absolute;left:0;top:${f ? 30 : 60}px">${page(img("ideias.jpg"), f ? 330 : 380, -6, f ? 470 : 640)}</div>
        <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);z-index:2">${page(img("capitulo-1.jpg"), f ? 360 : 420, 0, f ? 520 : 720)}</div>
        <div style="position:absolute;right:0;top:${f ? 40 : 80}px">${page(img("clientes.jpg"), f ? 330 : 380, 6, f ? 450 : 620)}</div>
      </div>
      ${cta("Quero o material completo")}${legal}`,
  },
  {
    id: "03-valor",
    nome: "Valor: 5 materiais",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 108 : 124}px;margin-top:${f ? 40 : 70}px">5 materiais.<br><mark>R$ 19,90.</mark></h1>
      <div style="display:flex;flex-direction:column;gap:12px;margin-top:${f ? 34 : 50}px;font-size:${f ? 28 : 31}px">
        <div class="row">Guia Rota Invisível · 7 capítulos <small>Principal</small></div>
        <div class="row">30 ideias de renda extra <small>Incluso</small></div>
        <div class="row">Kit de ferramentas gratuitas <small>Incluso</small></div>
        <div class="row">Guia para encontrar clientes <small>Incluso</small></div>
        <div class="row">Plano de execução de 30 dias <small>Incluso</small></div>
      </div>
      <div style="margin-top:22px"><span class="pill">Equivale a R$ 3,98 por material · sem mensalidade</span></div>
      ${f ? `<div style="flex:1"></div>` : `<div class="bookStage" style="flex:1;min-height:0">${hero(300)}</div>`}
      ${cta()}${legal}`,
  },
  {
    id: "04-sem-investir",
    nome: "Começar sem investir",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 90 : 104}px;margin-top:${f ? 40 : 70}px">Dá para começar<br><em>sem investir.</em></h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:20px;max-width:900px">Várias das 30 ideias do guia começam com <b>R$ 0</b>. Cada uma mostra o investimento, o tempo e o primeiro passo.</p>
      <div style="display:grid;gap:14px;margin-top:${f ? 30 : 46}px">
        <div class="card"><div class="k">Ideia 07 · Investimento R$ 0</div><div class="t">Desapego do que você não usa</div><div class="d">Primeiro passo: separe 10 itens e anuncie com boas fotos hoje.</div></div>
        <div class="card"><div class="k">Ideia 03 · Investimento R$ 0</div><div class="t">Artes e cardápios no Canva</div><div class="d">Primeiro passo: monte um cardápio de exemplo e ofereça a três estabelecimentos.</div></div>
        ${f ? "" : `<div class="card"><div class="k">Ideia 20 · Investimento R$ 0</div><div class="t">Passeio e cuidado de pets</div><div class="d">Primeiro passo: divulgue pacotes semanais no grupo do condomínio.</div></div>`}
      </div>
      <div class="bookStage" style="flex:1;min-height:0">${hero(f ? 220 : 270)}</div>
      ${cta("Ver as 30 ideias")}${legal}`,
  },
  {
    id: "05-pouco-tempo",
    nome: "Pouco tempo",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 90 : 104}px;margin-top:${f ? 40 : 70}px">Pouco tempo?<br><em>Comece em blocos curtos.</em></h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:20px;max-width:900px">O plano de 30 dias divide tudo em tarefas pequenas, dia a dia — começando pela decisão do que fazer.</p>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:28px;margin-top:20px">
        ${page(img("plano-30-dias.jpg"), f ? 430 : 520, -3, f ? 470 : 680)}
        <div class="bookStage" style="width:${f ? 260 : 300}px">${hero(f ? 230 : 270)}</div>
      </div>
      ${cta()}${legal}`,
  },
  {
    id: "06-primeiro-cliente",
    nome: "Primeiro cliente (scripts)",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 86 : 100}px;margin-top:${f ? 40 : 70}px">O difícil não é a ideia.<br><em>É o primeiro cliente.</em></h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:20px">O guia traz <b>scripts de abordagem prontos</b> para adaptar e enviar. Um deles:</p>
      <div class="chat" style="margin-top:${f ? 30 : 50}px">
        <div class="hd"><i>💬</i> Mensagem para um conhecido</div>
        <div class="bubble">Oi, <em>[nome]</em>! Tudo bem por aí? Comecei a oferecer <em>[serviço]</em> e estou separando alguns horários com valor de lançamento para as primeiras pessoas. Lembrei de você porque <em>[motivo]</em>. Quer que eu te explique como funciona?<span class="tm">Script 2 · Círculo quente</span></div>
      </div>
      <div class="bookStage" style="flex:1;min-height:0">${hero(f ? 220 : 270)}</div>
      ${cta("Quero os scripts")}${legal}`,
  },
  {
    id: "07-30-ideias",
    nome: "Lista: 30 ideias",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 96 : 110}px;margin-top:${f ? 40 : 70}px"><em>30 ideias</em> de renda extra.</h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:18px">Da internet ao seu bairro — com o primeiro passo de cada uma.</p>
      <div class="ideas" style="margin-top:${f ? 30 : 46}px">
        <div><b>01</b>Social media para negócios locais</div><div><b>02</b>Edição de vídeos curtos</div>
        <div><b>06</b>Aulas particulares on-line</div><div><b>10</b>Afiliado de produtos</div>
        <div><b>13</b>Bolo de pote por encomenda</div><div><b>15</b>Salgados congelados</div>
        <div><b>19</b>Faxina e organização</div><div><b>21</b>Montagem de móveis</div>
        ${f ? "" : `<div><b>25</b>Personalizados e papelaria</div><div><b>29</b>Embrulho de presentes</div>`}
      </div>
      <div style="margin-top:16px;font-family:Inter;font-weight:800;font-size:26px;color:#ff8a2a">+ ${f ? 22 : 20} ideias no bônus</div>
      <div class="bookStage" style="flex:1;min-height:0">${hero(f ? 220 : 270)}</div>
      ${cta("Ver todas as ideias")}${legal}`,
  },
  {
    id: "08-online-offline",
    nome: "Online ou no bairro",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 92 : 106}px;margin-top:${f ? 40 : 70}px">Pela internet<br><em>ou no seu bairro.</em></h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:20px">O guia mostra os dois lados — e ajuda a escolher o que combina com a sua rotina.</p>
      <div class="split" style="margin-top:${f ? 34 : 50}px">
        <div class="col"><h3>Pela <span>internet</span></h3><ul>
          <li>Social media <b>R$ 0</b></li><li>Edição de vídeos <b>R$ 0</b></li><li>Afiliados <b>R$ 0</b></li>${f ? "" : "<li>Assistente virtual <b>R$ 0</b></li>"}</ul></div>
        <div class="col"><h3>No <span>bairro</span></h3><ul>
          <li>Bolo de pote <b>até R$ 50</b></li><li>Passeio de pets <b>R$ 0</b></li><li>Faxina <b>até R$ 50</b></li>${f ? "" : "<li>Aulas de reforço <b>R$ 0</b></li>"}</ul></div>
      </div>
      <div class="bookStage" style="flex:1;min-height:0">${hero(f ? 220 : 270)}</div>
      ${cta()}${legal}`,
  },
  {
    id: "09-sem-formula-magica",
    nome: "Transparência: não é fórmula mágica",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 96 : 110}px;margin-top:${f ? 40 : 70}px">Não é fórmula mágica.<br><em>É um mapa.</em></h1>
      <div class="vs" style="margin-top:${f ? 34 : 54}px">
        <div class="yes"><h3>✓ É para quem</h3><p>Quer começar uma renda extra</p><p>Está perdido entre opções</p><p>Precisa achar os primeiros clientes</p>${f ? "" : "<p>Quer um plano para seguir</p>"}</div>
        <div class="no"><h3>✕ Não é para quem</h3><p>Quer dinheiro sem executar nada</p><p>Procura renda garantida</p><p>Espera enriquecer rápido</p></div>
      </div>
      <div style="margin-top:22px"><span class="pill">7 dias de direito de arrependimento (CDC)</span></div>
      <div class="bookStage" style="flex:1;min-height:0">${hero(f ? 220 : 270)}</div>
      ${cta()}${legal}`,
  },
  {
    id: "10-plano-30-dias",
    nome: "Plano de 30 dias",
    html: (f) => `
      ${brand}
      <h1 style="font-size:${f ? 90 : 104}px;margin-top:${f ? 40 : 70}px">Da ideia à primeira oferta,<br><em>em 30 dias.</em></h1>
      <p class="sub" style="font-size:${f ? 30 : 34}px;margin-top:20px">Um roteiro com tarefas diárias para sair da dúvida e começar a executar.</p>
      <div class="weeks" style="margin-top:${f ? 40 : 60}px">
        <div class="wk"><b>S1</b><span>Escolher</span><small>e preparar</small></div>
        <div class="wk"><b>S2</b><span>Oferecer</span><small>primeiras abordagens</small></div>
        <div class="wk"><b>S3</b><span>Ajustar</span><small>o que funcionou</small></div>
        <div class="wk"><b>S4</b><span>Consolidar</span><small>rotina e indicações</small></div>
      </div>
      <div class="bookStage" style="flex:1">${hero(f ? 230 : 330)}</div>
      ${cta()}${legal}`,
  },
];

const formats = [
  { tag: "feed-4x5", w: 1080, h: 1350, pt: 64, pb: 60, f: true },
  { tag: "stories-9x16", w: 1080, h: 1920, pt: 200, pb: 280, f: false }, // zonas seguras de Stories/Reels
];

const browser = await chromium.launch();
for (const fmt of formats) {
  const p = await browser.newPage({ viewport: { width: fmt.w, height: fmt.h } });
  for (const ad of ads) {
    await p.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>
      <body style="--w:${fmt.w}px;--h:${fmt.h}px;--pt:${fmt.pt}px;--pb:${fmt.pb}px"><div class="bg"></div><div class="grid"></div>
      <div class="wrap">${ad.html(fmt.f)}</div></body></html>`);
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(150);
    // livro se ajusta ao espaço livre entre o conteúdo e o botão (cabe sempre, sem encostar)
    await p.evaluate(() => {
      for (const stage of document.querySelectorAll(".bookStage")) {
        const book = stage.querySelector(".book");
        const aura = stage.querySelector(".aura");
        if (!book) continue;
        const free = stage.getBoundingClientRect().height - 50;
        const w = book.getBoundingClientRect().width;
        const h = (w * 4) / 3;
        if (h > free && free > 120) {
          const nw = Math.round((free * 3) / 4);
          book.style.width = nw + "px";
          book.style.setProperty("--bw", nw + "px");
          if (aura) aura.style.width = aura.style.height = nw * 2.1 + "px";
        }
      }
    });
    await p.waitForTimeout(50);
    const overflow = await p.evaluate(() => document.querySelector(".wrap").scrollHeight - innerHeight);
    if (overflow > 2) console.warn(`  ! ${ad.id} ${fmt.tag}: conteúdo passa ${overflow}px`);
    // nada (livro, página) pode encostar no botão de compra
    const hit = await p.evaluate(() => {
      const cta = document.querySelector(".ctaRow").getBoundingClientRect();
      return [...document.querySelectorAll(".book, .sheet")].some((el) => el.getBoundingClientRect().bottom > cta.top - 8);
    });
    if (hit) console.warn(`  ! ${ad.id} ${fmt.tag}: imagem encosta no botão`);
    await p.screenshot({ path: path.join(out, `C${ad.id}-${fmt.tag}.png`) });
  }
  await p.close();
}
await browser.close();
console.log("ok:", ads.length * formats.length, "arquivos em", out);

import { describe, expect, it } from "vitest";
import type { CampaignConfig } from "@/lib/domain/config";
import { resolveProfile, scoreProfiles } from "@/lib/engine/rules";
import { builtinTemplates } from "@/lib/templates/builtin";

const rota = () => structuredClone(builtinTemplates.find((t) => t.key === "rota-invisivel")!.config) as CampaignConfig;

/** todas as combinações das 7 perguntas (4·5·5·4·5·5·3 = 30.000) */
function* allAnswers(c: CampaignConfig) {
  const qs = c.quiz.questions;
  const idx = qs.map(() => 0);
  while (true) {
    yield Object.fromEntries(qs.map((q, i) => [q.id, q.options[idx[i]].id]));
    let k = qs.length - 1;
    while (k >= 0 && ++idx[k] === qs[k].options.length) idx[k--] = 0;
    if (k < 0) return;
  }
}
const val = (c: CampaignConfig, a: Record<string, string>, q: string) => c.quiz.questions.find((x) => x.id === q)!.options.find((o) => o.id === a[q])!.value;
const ans = (c: CampaignConfig, pick: Record<string, string>) =>
  Object.fromEntries(c.quiz.questions.map((q) => [q.id, (q.options.find((o) => o.value === pick[q.id]) ?? q.options[0]).id]));

describe("quiz em 4 etapas — Genéricas → Dor → Desejo → Solução", () => {
  const c = rota();
  it("abertura, perguntas e etapas na ordem definida", () => {
    expect(c.quiz.intro.title).toBe("Você quer ganhar dinheiro extra, mas ainda não sabe por onde começar?");
    expect(c.quiz.intro.subtitle).toMatch(/realidade, seus objetivos e o tempo/);
    expect(c.quiz.questions.map((q) => q.id)).toEqual(["situacao", "dificuldade", "dor", "objetivo", "conquista", "preferencia", "tempo"]);
    expect(c.quiz.questions.map((q) => q.options.length)).toEqual([4, 5, 5, 4, 5, 5, 3]);
    expect(c.quiz.questions.map((q) => q.stage.slice(0, 11))).toEqual(["Etapa 1 de ", "Etapa 2 de ", "Etapa 2 de ", "Etapa 3 de ", "Etapa 3 de ", "Etapa 4 de ", "Etapa 4 de "]);
    expect(c.quiz.settings.transitionSteps).toEqual(["Analisando suas respostas...", "Identificando oportunidades compatíveis com seu perfil...", "Preparando sua recomendação..."]);
    expect(c.scoring.mode).toBe("points");
  });
});

describe("classificação por pontos — todas as 30.000 combinações", () => {
  const c = rota();
  const byId = new Map(c.profiles.map((p) => [p.id, p]));
  const results: { a: Record<string, string>; id: string; reasons: string[]; reality: string[]; points: Record<string, number> }[] = [];
  const seen = new Map<string, number>();
  for (const a of allAnswers(c)) {
    const r = resolveProfile(c, a);
    results.push({ a, id: r.profile!.id, reasons: r.reasons, reality: r.reality, points: r.points });
    seen.set(r.profile!.id, (seen.get(r.profile!.id) ?? 0) + 1);
  }

  it("todas geram resultado completo: 4 frases de realidade, 3 de 'por que', 3 oportunidades detalhadas e primeiro passo", () => {
    expect(results).toHaveLength(30000);
    for (const r of results) {
      const p = byId.get(r.id)!;
      expect(r.reality).toHaveLength(4);
      expect(r.reasons).toHaveLength(3);
      expect(p.paths).toHaveLength(3);
      for (const path of p.paths) for (const f of ["how", "needs", "challenge", "firstStep"] as const) expect(path[f].length).toBeGreaterThan(10);
    }
  });

  it("os 6 perfis são alcançáveis e nenhum domina tudo", () => {
    expect([...seen.keys()].sort()).toEqual(["direcao", "iniciante", "internet", "pouco_tempo", "servicos", "vendas"]);
    for (const n of seen.values()) expect(n).toBeLessThan(30000 * 0.5);
  });

  it("o vencedor é sempre o maior total; empate segue a ordem documentada", () => {
    for (const r of results.slice(0, 3000)) {
      const max = Math.max(...Object.values(r.points));
      expect(r.points[r.id]).toBe(max);
      const tied = c.scoring.tieBreak.filter((id) => r.points[id] === max);
      expect(r.id).toBe(tied[0]);
    }
  });

  it("nenhuma oportunidade de nenhum perfil exige investimento além de R$ 50 (o quiz não pergunta capital)", () => {
    for (const p of c.profiles) for (const path of p.paths) expect(path.needs, `${p.id}: ${path.title}`).toMatch(/R\$ 0/);
  });

  it("nenhuma oportunidade exige blocos longos de tempo (compatível com quem tem até 1 hora)", () => {
    for (const p of c.profiles) for (const path of p.paths) expect(`${path.how} ${path.needs}`).not.toMatch(/\b[4-9] a \d+ ?h|1 dia|período integral/);
  });

  it("até 1 hora por dia + falta de tempo → sempre 'Pouco tempo disponível'", () => {
    for (const r of results) if (val(c, r.a, "tempo") === "ate_1h" && val(c, r.a, "dificuldade") === "sem_tempo") expect(r.id).toBe("pouco_tempo");
  });

  it("recomendação respeita a alternativa escolhida (ou uma restrição de tempo/dinheiro)", () => {
    const allowed: Record<string, string[]> = {
      vendas: ["vendas", "pouco_tempo", "iniciante"],
      servicos: ["servicos", "pouco_tempo", "iniciante"],
      internet: ["internet", "pouco_tempo", "iniciante"],
      conteudo: ["internet", "pouco_tempo", "iniciante"],
      indefinido: ["direcao", "iniciante", "pouco_tempo"],
    };
    for (const r of results) expect(allowed[val(c, r.a, "preferencia")], JSON.stringify(r.a)).toContain(r.id);
  });

  it("quem já tentou e não conseguiu recebe a atenção à execução e aos clientes em primeiro lugar", () => {
    for (const r of results) if (val(c, r.a, "dificuldade") === "ja_tentou") expect(r.reasons[0]).toMatch(/já tentou antes/);
  });

  it("quem não tem dinheiro vê a justificativa de custo zero", () => {
    for (const r of results) if (val(c, r.a, "dificuldade") === "sem_dinheiro") expect(r.reasons.join(" ")).toMatch(/não depende de estoque|nenhum caminho abaixo depende/);
  });

  it("exemplos representativos", () => {
    const cases: [Record<string, string>, string][] = [
      [{ situacao: "acaba_antes", dificuldade: "sem_dinheiro", dor: "planos", objetivo: "ate_500", conquista: "dividas", preferencia: "servicos", tempo: "1_3h" }, "iniciante"],
      [{ situacao: "tranquilo", dificuldade: "clientes", dor: "liberdade", objetivo: "1000_2000", conquista: "liberdade", preferencia: "internet", tempo: "1_3h" }, "internet"],
      [{ situacao: "nova_fonte", dificuldade: "clientes", dor: "planos", objetivo: "500_1000", conquista: "planos", preferencia: "vendas", tempo: "mais_3h" }, "vendas"],
      [{ situacao: "nova_fonte", dificuldade: "clientes", dor: "planos", objetivo: "500_1000", conquista: "planos", preferencia: "servicos", tempo: "mais_3h" }, "servicos"],
      [{ situacao: "sobra_pouco", dificuldade: "sem_tempo", dor: "trabalho_muito", objetivo: "ate_500", conquista: "tranquilidade", preferencia: "vendas", tempo: "ate_1h" }, "pouco_tempo"],
      [{ situacao: "tranquilo", dificuldade: "por_onde_comecar", dor: "parado", objetivo: "500_1000", conquista: "segunda_fonte", preferencia: "indefinido", tempo: "1_3h" }, "direcao"],
    ];
    for (const [pick, expected] of cases) expect(resolveProfile(c, ans(c, pick)).profile!.id).toBe(expected);
    // o resultado muda conforme as respostas
    const pts = scoreProfiles(c, ans(c, cases[0][0])).points;
    expect(pts.iniciante).toBe(2 + 3 + 1); // situação + dificuldade + conquista
  });
});

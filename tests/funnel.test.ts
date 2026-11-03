import { describe, expect, it } from "vitest";
import type { CampaignConfig } from "@/lib/domain/config";
import { resolveProfile } from "@/lib/engine/rules";
import { builtinTemplates } from "@/lib/templates/builtin";

const rota = () => structuredClone(builtinTemplates.find((t) => t.key === "rota-invisivel")!.config) as CampaignConfig;

/** todas as combinações possíveis das 7 perguntas (4·3·4·5·5·3·2 = 7.200) */
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

describe("quiz Rota Invisível — 7 perguntas", () => {
  it("abertura e perguntas com a redação definida", () => {
    const c = rota();
    expect(c.quiz.intro.title).toBe("Você quer ganhar dinheiro extra, mas ainda não sabe por onde começar?");
    expect(c.quiz.intro.ctaLabel).toBe("Descobrir meu caminho");
    expect(c.quiz.questions).toHaveLength(7);
    expect(c.quiz.questions.map((q) => q.options.length)).toEqual([4, 3, 4, 5, 5, 3, 2]);
    expect(c.quiz.questions[2].options[0].label).toBe("Quero começar sem investir");
    expect(c.quiz.questions[3].options.map((o) => o.label)).toContain("Trabalhar pela internet");
  });
});

describe("resultado personalizado — todas as 7.200 combinações", () => {
  const c = rota();
  const seen = new Map<string, number>();
  const results: { a: Record<string, string>; id: string; reasons: string[] }[] = [];
  for (const a of allAnswers(c)) {
    const r = resolveProfile(c, a);
    results.push({ a, id: r.profile!.id, reasons: r.reasons });
    seen.set(r.profile!.id, (seen.get(r.profile!.id) ?? 0) + 1);
  }

  it("toda combinação gera um perfil completo: 3 justificativas, 3 caminhos detalhados e primeiro passo", () => {
    expect(results).toHaveLength(7200);
    const byId = new Map(c.profiles.map((p) => [p.id, p]));
    for (const r of results) {
      const p = byId.get(r.id)!;
      expect(r.reasons).toHaveLength(3);
      expect(p.paths).toHaveLength(3);
      for (const path of p.paths) for (const f of ["how", "needs", "challenge", "firstStep"] as const) expect(path[f].length, `${p.id}.${path.title}.${f}`).toBeGreaterThan(10);
      expect(p.firstStep.length).toBeGreaterThan(20);
    }
  });

  it("os 7 perfis são alcançáveis (ninguém recebe sempre o mesmo resultado)", () => {
    expect([...seen.keys()].sort()).toEqual(["conteudo", "explorador", "iniciante", "local", "servicos_digitais", "servicos_locais", "vendedor"]);
  });

  it("quem quer começar sem investir (ou com até R$ 50) nunca recebe caminhos que dependem de capital", () => {
    for (const r of results) {
      const cap = val(c, r.a, "capital");
      if (cap === "zero" || cap === "ate_50") expect(["local", "explorador"]).not.toContain(r.id);
    }
  });

  it("perfil respeita a atividade preferida", () => {
    const allowed: Record<string, string[]> = {
      vendas: ["vendedor", "local"],
      servicos: ["servicos_locais", "servicos_digitais"],
      internet: ["servicos_digitais"],
      conteudo: ["conteudo"],
      indefinido: ["iniciante", "explorador", "local"],
    };
    for (const r of results) expect(allowed[val(c, r.a, "preferencia")]).toContain(r.id);
  });

  it("serviços presenciais só para quem aceita atuar na região; quem escolheu internet recebe serviços digitais", () => {
    for (const r of results) {
      if (r.id === "servicos_locais") expect(val(c, r.a, "onde")).not.toBe("internet");
      if (val(c, r.a, "preferencia") === "servicos" && val(c, r.a, "onde") === "internet") expect(r.id).toBe("servicos_digitais");
    }
  });

  it("justificativas vêm das respostas reais (investimento, tempo e preferência)", () => {
    const sample = results.find((r) => val(c, r.a, "capital") === "zero" && val(c, r.a, "tempo") === "ate_1h" && val(c, r.a, "preferencia") === "internet")!;
    expect(sample.reasons[0]).toMatch(/sem investir/);
    expect(sample.reasons[1]).toMatch(/até 1 hora/);
    expect(sample.reasons[2]).toMatch(/pela internet/);
  });
});

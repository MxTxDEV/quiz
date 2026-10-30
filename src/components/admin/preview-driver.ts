import type { CampaignConfig } from "@/lib/domain/config";
import { toPublicProfile } from "@/lib/domain/public";
import type { Answers } from "@/lib/engine/answers";
import { resolveProfile } from "@/lib/engine/rules";
import type { QuizDriver } from "@/components/public/quiz-runner";

/**
 * Driver de pré-visualização: executa o mesmo motor de regras localmente sobre o RASCUNHO,
 * sem criar sessões nem registrar eventos.
 */
export function createPreviewDriver(config: CampaignConfig, onResolve?: (info: { profileId: string | null; ruleId: string | null; answers: Answers }) => void): QuizDriver {
  const answers: Answers = {};
  return {
    async start() {},
    async answer(id, value) {
      if (value === null) delete answers[id];
      else answers[id] = value;
    },
    async complete() {
      const r = resolveProfile(config, answers);
      onResolve?.({ profileId: r.profile?.id ?? null, ruleId: r.matchedRuleId, answers: { ...answers } });
      return {
        profile: r.profile ? toPublicProfile(r.profile) : null,
        ctaHref: "#preview-oferta",
      };
    },
    async resultViewed() {},
    async lead() {},
  };
}

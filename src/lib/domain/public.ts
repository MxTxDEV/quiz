import type { CampaignConfig, LeadCapture, Profile, Question, Quiz, Theme } from "./config";

/**
 * Projeções enviadas ao navegador do visitante.
 * Pontuações, atributos e regras ficam apenas no servidor.
 */
export type PublicQuestion = Omit<Question, "options" | "attributeKey"> & {
  options: { id: string; label: string }[];
};

export type PublicQuiz = {
  intro: Quiz["intro"];
  settings: Quiz["settings"];
  questions: PublicQuestion[];
  /** textos da página de resultado (as condições das justificativas ficam no servidor) */
  result: Omit<Quiz["result"], "reasons" | "reality">;
};

export type PublicProfile = Omit<Profile, "isDefault">;

export type PublicLeadCapture = Pick<LeadCapture, "mode" | "required" | "askName" | "title" | "description" | "consentText">;

export type PublicCampaign = {
  id: string;
  slug: string;
  theme: Theme;
  quiz: PublicQuiz;
  leadCapture: PublicLeadCapture;
};

export function toPublicQuiz(quiz: Quiz): PublicQuiz {
  return {
    intro: quiz.intro,
    settings: quiz.settings,
    result: (({ reasons: _r, reality: _re, ...rest }) => rest)(quiz.result),
    questions: quiz.questions.map(({ options, attributeKey: _a, ...q }) => ({
      ...q,
      // pontos, atributos e valores ficam no servidor
      options: options.map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

export function toPublicProfile(p: Profile): PublicProfile {
  const { isDefault: _d, ...rest } = p;
  return rest;
}

export function toPublicCampaign(c: { id: string; slug: string; config: CampaignConfig }): PublicCampaign {
  const lc = c.config.leadCapture;
  return {
    id: c.id,
    slug: c.slug,
    theme: c.config.theme,
    quiz: toPublicQuiz(c.config.quiz),
    leadCapture: {
      mode: lc.mode,
      required: lc.required,
      askName: lc.askName,
      title: lc.title,
      description: lc.description,
      consentText: lc.consentText,
    },
  };
}

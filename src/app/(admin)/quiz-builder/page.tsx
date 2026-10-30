import { PageHeader } from "@/components/ui/misc";
import { CampaignPicker } from "@/components/admin/campaign-picker";

export const metadata = { title: "Quiz Builder" };

export default function QuizBuilderIndex() {
  return (
    <>
      <PageHeader title="Quiz Builder" description="Escolha a campanha cujo quiz você quer editar." />
      <CampaignPicker section="quiz" cta="Editar quiz" meta={(c) => `${c.questionCount} pergunta(s)`} />
    </>
  );
}

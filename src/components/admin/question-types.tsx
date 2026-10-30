import { CircleDot, Hash, ListChecks, SlidersHorizontal, ToggleLeft, Type } from "lucide-react";
import type { QuestionType } from "@/lib/domain/config";

export const questionTypeMeta: Record<QuestionType, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  single: { label: "Escolha única", icon: CircleDot },
  multiple: { label: "Múltipla escolha", icon: ListChecks },
  text: { label: "Texto curto", icon: Type },
  number: { label: "Número", icon: Hash },
  range: { label: "Faixa de valores", icon: SlidersHorizontal },
  yes_no: { label: "Sim ou não", icon: ToggleLeft },
};

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap", {
  variants: {
    tone: {
      neutral: "bg-muted text-muted-foreground",
      success: "bg-success-soft text-success",
      warning: "bg-warning-soft text-warning",
      danger: "bg-danger-soft text-danger",
      accent: "bg-accent-soft text-accent",
    },
  },
  defaultVariants: { tone: "neutral" },
});

export function Badge({ className, tone, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badge>) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}

const statusMap = {
  draft: { label: "Rascunho", tone: "neutral" },
  published: { label: "Publicada", tone: "success" },
  paused: { label: "Pausada", tone: "warning" },
  archived: { label: "Arquivada", tone: "neutral" },
  active: { label: "Ativo", tone: "success" },
  inactive: { label: "Inativo", tone: "neutral" },
} as const;

export function StatusBadge({ status }: { status: keyof typeof statusMap }) {
  const s = statusMap[status];
  return (
    <Badge tone={s.tone}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {s.label}
    </Badge>
  );
}

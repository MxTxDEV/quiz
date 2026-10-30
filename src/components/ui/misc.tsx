import * as React from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-14 text-center", className)}>
      {Icon && (
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
      )}
      <p className="text-sm font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full text-[13px]", className)} {...props} />
    </div>
  );
}
export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return <th className={cn("h-9 px-4 text-left text-xs font-medium text-muted-foreground border-b bg-muted/40 whitespace-nowrap", className)} {...props} />;
}
export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-2.5 border-b align-middle", className)} {...props} />;
}

export function Notice({ tone = "neutral", children, className }: { tone?: "neutral" | "warning" | "danger" | "success"; children: React.ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-muted text-foreground",
    warning: "bg-warning-soft text-warning border-warning/20",
    danger: "bg-danger-soft text-danger border-danger/20",
    success: "bg-success-soft text-success border-success/20",
  };
  return <div className={cn("rounded-md border border-transparent px-3 py-2.5 text-[13px]", tones[tone], className)}>{children}</div>;
}

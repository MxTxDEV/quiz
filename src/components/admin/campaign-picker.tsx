import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/misc";
import { listCampaigns } from "@/lib/services/campaigns";

/** Atalho: lista campanhas e leva direto para um editor específico. */
export async function CampaignPicker({ section, cta, meta }: { section: string; cta: string; meta: (c: { questionCount: number }) => string }) {
  const rows = await listCampaigns();
  if (!rows.length)
    return (
      <EmptyState
        icon={Megaphone}
        title="Nenhuma campanha"
        description="Os editores são vinculados a uma campanha. Crie a primeira para começar."
        action={<Button asChild variant="outline"><Link href="/campaigns/new">Nova campanha</Link></Button>}
      />
    );
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((c) => (
        <Link key={c.id} href={`/campaigns/${c.id}/${section}`} className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/40">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">{c.name}</p>
            <StatusBadge status={c.status} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">/q/{c.slug}</p>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{meta(c)}</span>
            <span className="inline-flex items-center gap-1 text-foreground opacity-0 transition group-hover:opacity-100">
              {cta} <ArrowRight className="size-3.5" />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

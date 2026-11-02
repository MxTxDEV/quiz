"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Copy, ExternalLink, Eye, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { CampaignMenu, usePublish } from "@/components/admin/campaign-actions";
import type { CampaignStatus } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "", label: "Geral" },
  { href: "/quiz", label: "Quiz" },
  { href: "/results", label: "Resultados e regras" },
  { href: "/sales-page", label: "Página de vendas" },
  { href: "/reviews", label: "Avaliações" },
  { href: "/leads", label: "Leads e LGPD" },
  { href: "/tracking", label: "Rastreamento" },
  { href: "/analytics", label: "Analytics" },
];

export function CampaignHeader(props: {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  publicUrl: string;
  unpublished: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const pathname = usePathname();
  const base = `/campaigns/${props.id}`;
  const { publish, pending, dialog } = usePublish();
  const live = props.status === "published";

  return (
    <div className="mb-6">
      <Link href="/campaigns" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2">
        <ChevronLeft className="size-3.5" /> Campanhas
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold tracking-tight truncate">{props.name}</h1>
            <StatusBadge status={props.status} />
            {props.unpublished && live && <Badge tone="warning">Rascunho com alterações não publicadas</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-mono">{props.publicUrl}</span>
            <button
              className="p-1 rounded hover:bg-muted cursor-pointer"
              aria-label="Copiar link"
              onClick={() => {
                navigator.clipboard.writeText(props.publicUrl);
                toast.success("Link copiado");
              }}
            >
              <Copy className="size-3.5" />
            </button>
            {live && (
              <a href={props.publicUrl} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-muted" aria-label="Abrir campanha publicada">
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/preview/${props.id}`} target="_blank"><Eye /> Visualizar rascunho</Link>
          </Button>
          {props.canEdit && (
            <Button size="sm" variant="accent" loading={pending} onClick={() => publish(props.id)} disabled={live && !props.unpublished}>
              <Rocket /> {live ? (props.unpublished ? "Publicar alterações" : "Publicada") : "Publicar"}
            </Button>
          )}
          <CampaignMenu id={props.id} slug={props.slug} name={props.name} status={props.status} publicUrl={props.publicUrl} canDelete={props.canDelete} />
        </div>
      </div>
      <nav className="mt-5 flex gap-1 overflow-x-auto border-b -mb-px">
        {tabs.map((t) => {
          const href = `${base}${t.href}`;
          const active = t.href === "" ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={t.href}
              href={href}
              className={cn(
                "whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {dialog}
    </div>
  );
}

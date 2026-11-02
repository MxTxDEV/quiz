"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { BadgeCheck, Check, Copy, MessageCircle, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/misc";
import { deleteReviewAction, setReviewStatusAction } from "@/app/(admin)/campaigns/[id]/reviews/actions";

type Row = { id: string; name: string; city: string; rating: number; text: string; email: string; verified: boolean; status: "pending" | "approved" | "rejected"; createdAt: string };

const statusLabel = { pending: "Aguardando", approved: "Publicada", rejected: "Recusada" } as const;
const statusTone = { pending: "warning", approved: "success", rejected: "neutral" } as const;

export function ReviewsPanel({
  campaignId,
  link,
  hasBlock,
  buyers,
  reviews,
  canEdit,
  canDelete,
}: {
  campaignId: string;
  link: string;
  hasBlock: boolean;
  buyers: number;
  reviews: Row[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [pending, start] = useTransition();
  const shown = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const counts = { pending: 0, approved: 0, rejected: 0 } as Record<Row["status"], number>;
  for (const r of reviews) counts[r.status]++;

  const message = `Oi! Obrigado por comprar. Se puder, me conta em 1 minuto o que você está achando? Sua avaliação ajuda muito: ${link}`;
  const act = (id: string, status: Row["status"]) =>
    start(async () => {
      const res = await setReviewStatusAction(id, status);
      if (!res.ok) toast.error(res.error);
      else toast.success(status === "approved" ? "Avaliação publicada na página" : status === "rejected" ? "Avaliação recusada" : "Voltou para aprovação");
    });

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-4">
        {!hasBlock && (
          <Notice tone="warning">
            A página de vendas ainda não tem o bloco <b>Avaliações de compradores</b>. Adicione em Página de vendas → Adicionar bloco (ou aplique a versão do modelo) e publique.
          </Notice>
        )}
        <div className="flex flex-wrap gap-1.5">
          {(["pending", "approved", "rejected", "all"] as const).map((f) => (
            <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>
              {f === "all" ? `Todas (${reviews.length})` : `${statusLabel[f]} (${counts[f]})`}
            </Button>
          ))}
        </div>
        {shown.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {reviews.length === 0 ? "Nenhuma avaliação ainda. Envie o link ao lado para quem comprou." : "Nada por aqui."}
            </CardContent>
          </Card>
        )}
        {shown.map((r) => (
          <Card key={r.id}>
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="size-4" strokeWidth={0} style={{ fill: i <= r.rating ? "#f59e0b" : "#e4e4e7" }} />
                  ))}
                </span>
                <b className="text-sm">{r.name}{r.city ? ` · ${r.city}` : ""}</b>
                <Badge tone={statusTone[r.status]}>{statusLabel[r.status]}</Badge>
                {r.verified ? (
                  <Badge tone="success"><BadgeCheck className="size-3" /> Compra verificada</Badge>
                ) : (
                  <Badge tone="neutral" title="O e-mail informado não foi encontrado nas vendas confirmadas desta campanha (confira se o webhook da Kiwify está configurado).">Compra não confirmada</Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <p className="whitespace-pre-line text-[15px] leading-relaxed">{r.text}</p>
              <p className="text-xs text-muted-foreground">E-mail (privado): {r.email || "—"}</p>
              {canEdit && (
                <div className="flex flex-wrap gap-2">
                  {r.status !== "approved" && (
                    <Button size="sm" disabled={pending} onClick={() => act(r.id, "approved")}><Check /> Publicar</Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button size="sm" variant="outline" disabled={pending} onClick={() => act(r.id, "rejected")}><X /> {r.status === "approved" ? "Despublicar" : "Recusar"}</Button>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => {
                        if (!window.confirm("Excluir esta avaliação definitivamente? Use quando o autor pedir a remoção.")) return;
                        start(async () => {
                          const res = await deleteReviewAction(r.id, campaignId);
                          if (!res.ok) toast.error(res.error);
                          else toast.success("Avaliação excluída");
                        });
                      }}
                    >
                      <Trash2 /> Excluir
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Link para pedir avaliações</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Envie para quem comprou. Quem usar o mesmo e-mail da compra ganha o selo “Compra verificada”.</p>
            <div className="break-all rounded-md border bg-muted/40 p-2.5 font-mono text-xs">{link}</div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(link).then(() => toast.success("Link copiado"))}><Copy /> Copiar link</Button>
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(message).then(() => toast.success("Mensagem copiada"))}><MessageCircle /> Copiar mensagem</Button>
            </div>
            <p className="rounded-md bg-muted/40 p-2.5 text-xs leading-relaxed text-muted-foreground">{message}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Contador de compradores</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><b className="text-2xl">{buyers.toLocaleString("pt-BR")}</b> <span className="text-muted-foreground">vendas confirmadas</span></p>
            <p className="text-muted-foreground">Na página, aparece como “X pessoas já acessaram” quando passar do mínimo definido no bloco (padrão: 10). Conta apenas vendas confirmadas pelo webhook do checkout.</p>
          </CardContent>
        </Card>
        <Notice>Publique apenas avaliações reais. Não edite o texto do comprador; se algo não puder ser exibido (promessa de ganho, dados pessoais), recuse.</Notice>
      </div>
    </div>
  );
}

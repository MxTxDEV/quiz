"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Notice, Table, Td, Th } from "@/components/ui/misc";
import {
  createWebhookAction,
  deleteWebhookAction,
  saveGlobalTrackingAction,
  saveOutgoingWebhookAction,
  toggleWebhookAction,
} from "@/app/(admin)/integrations/actions";
import type { Tracking } from "@/lib/domain/config";
import { formatDate } from "@/lib/utils";

type Hook = {
  id: string;
  provider: "generic" | "hotmart" | "kiwify";
  name: string;
  secret: string;
  active: boolean;
  campaignName: string | null;
  lastReceivedAt: string | null;
};

const providerLabel = { generic: "Genérico (HMAC)", hotmart: "Hotmart", kiwify: "Kiwify" } as const;

function copy(text: string) {
  navigator.clipboard.writeText(text);
  toast.success("Copiado");
}

function useAction() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const exec = (fn: () => Promise<{ ok: boolean; error?: string }>, msg?: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      if (msg) toast.success(msg);
      after?.();
      router.refresh();
    });
  return { pending, exec };
}

export function IntegrationsPanel({
  tracking,
  outgoing,
  hooks,
  campaigns,
  baseUrl,
  canEdit,
}: {
  tracking: Tracking;
  outgoing: { url: string; secret: string; events: ("lead_captured" | "purchase_confirmed")[] };
  hooks: Hook[];
  campaigns: { id: string; name: string }[];
  baseUrl: string;
  canEdit: boolean;
}) {
  const [t, setT] = useState(tracking);
  const [o, setO] = useState(outgoing);
  const [open, setOpen] = useState(false);
  const a = useAction();

  return (
    <fieldset disabled={!canEdit} className="space-y-6">
      {!canEdit && <Notice tone="warning">Somente o proprietário pode alterar integrações.</Notice>}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Rastreamento global</CardTitle>
            <CardDescription>Aplicado a todas as campanhas, exceto as que definirem IDs próprios na aba Rastreamento.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Meta Pixel ID"><Input value={t.metaPixelId} onChange={(e) => setT({ ...t, metaPixelId: e.target.value.trim() })} placeholder="123456789012345" /></Field>
          <Field label="Google Analytics 4"><Input value={t.gaMeasurementId} onChange={(e) => setT({ ...t, gaMeasurementId: e.target.value.trim().toUpperCase() })} placeholder="G-XXXXXXX" /></Field>
          <Field label="Google Tag Manager"><Input value={t.gtmId} onChange={(e) => setT({ ...t, gtmId: e.target.value.trim().toUpperCase() })} placeholder="GTM-XXXXXX" /></Field>
          <div className="sm:col-span-3 flex justify-end">
            <Button size="sm" loading={a.pending} onClick={() => a.exec(() => saveGlobalTrackingAction(t), "Rastreamento salvo")}>Salvar</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Confirmação de vendas (webhooks de checkout)</CardTitle>
            <CardDescription>Uma venda só é contabilizada quando a plataforma de pagamento confirma por webhook validado.</CardDescription>
          </div>
          <Button size="sm" onClick={() => setOpen(true)}><Plus /> Novo endpoint</Button>
        </CardHeader>
        {hooks.length ? (
          <Table>
            <thead><tr><Th>Nome</Th><Th>Plataforma</Th><Th>URL do webhook</Th><Th>Campanha</Th><Th>Último recebimento</Th><Th>Ativo</Th><Th className="w-10" /></tr></thead>
            <tbody>
              {hooks.map((h) => {
                const url = `${baseUrl}/api/webhooks/${h.provider}/${h.id}`;
                return (
                  <tr key={h.id}>
                    <Td className="font-medium">{h.name}</Td>
                    <Td><Badge>{providerLabel[h.provider]}</Badge></Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <code className="max-w-56 truncate font-mono text-[11px] text-muted-foreground">{url}</code>
                        <button type="button" className="rounded p-1 hover:bg-muted cursor-pointer" onClick={() => copy(url)} aria-label="Copiar URL"><Copy className="size-3.5" /></button>
                        {h.provider === "generic" && (
                          <button type="button" className="rounded px-1.5 py-0.5 text-[11px] hover:bg-muted cursor-pointer" onClick={() => copy(h.secret)}>copiar segredo</button>
                        )}
                      </div>
                    </Td>
                    <Td className="text-muted-foreground">{h.campaignName ?? "Pela sessão"}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{formatDate(h.lastReceivedAt)}</Td>
                    <Td><Switch checked={h.active} onCheckedChange={(v) => a.exec(() => toggleWebhookAction(h.id, v))} /></Td>
                    <Td>
                      <Button variant="ghost" size="icon" aria-label="Excluir" onClick={() => confirm("Excluir este endpoint? A plataforma deixará de conseguir confirmar vendas por ele.") && a.exec(() => deleteWebhookAction(h.id), "Endpoint excluído")}>
                        <Trash2 className="text-muted-foreground" />
                      </Button>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        ) : (
          <CardContent><p className="text-[13px] text-muted-foreground">Nenhum endpoint configurado.</p></CardContent>
        )}
        <CardContent className="border-t pt-4 space-y-2 text-[13px] text-muted-foreground">
          <p><b className="text-foreground">Atribuição:</b> o botão de compra envia a sessão do visitante ao checkout nos parâmetros <code>sck</code>, <code>src</code> e <code>fos_sid</code>. A plataforma devolve esse valor no webhook e a venda é ligada à campanha, ao perfil e à origem do tráfego.</p>
          <p><b className="text-foreground">Hotmart:</b> cole a URL em Ferramentas → Webhook e use o Hottok da sua conta como token. <b className="text-foreground">Kiwify:</b> cole a URL no webhook do produto e use o token exibido pela Kiwify. Envie um evento de teste e confira em “Último recebimento”.</p>
          <p><b className="text-foreground">Genérico:</b> <code>POST</code> JSON <code>{`{"event":"purchase.confirmed","id":"…","amount_cents":9700,"session_id":"…"}`}</code> com header <code>x-funnelos-signature: sha256=HMAC_SHA256(corpo, segredo)</code>.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Webhook de saída</CardTitle>
            <CardDescription>Envia leads e vendas para o seu CRM ou automação de e-mail. Contém nome e e-mail — use apenas com sistemas seus.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="URL (https)"><Input value={o.url} onChange={(e) => setO({ ...o, url: e.target.value })} placeholder="https://seu-crm.com/webhook" /></Field>
          <Field label="Segredo para assinatura (opcional)" hint="Enviado como x-funnelos-signature (HMAC-SHA256)."><Input value={o.secret} onChange={(e) => setO({ ...o, secret: e.target.value })} /></Field>
          <div className="flex gap-4 text-[13px]">
            {(["lead_captured", "purchase_confirmed"] as const).map((ev) => (
              <label key={ev} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={o.events.includes(ev)} onChange={(e) => setO({ ...o, events: e.target.checked ? [...o.events, ev] : o.events.filter((x) => x !== ev) })} />
                {ev === "lead_captured" ? "Lead capturado" : "Venda confirmada"}
              </label>
            ))}
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button size="sm" loading={a.pending} onClick={() => a.exec(() => saveOutgoingWebhookAction(o), "Webhook de saída salvo")}>Salvar</Button>
          </div>
        </CardContent>
      </Card>
      <NewWebhookDialog open={open} onOpenChange={setOpen} campaigns={campaigns} />
    </fieldset>
  );
}

function NewWebhookDialog({ open, onOpenChange, campaigns }: { open: boolean; onOpenChange: (o: boolean) => void; campaigns: { id: string; name: string }[] }) {
  const [f, setF] = useState({ provider: "hotmart" as Hook["provider"], name: "", campaignId: "", secret: "" });
  const a = useAction();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Novo endpoint de webhook">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            a.exec(() => createWebhookAction({ ...f, campaignId: f.campaignId || null }), "Endpoint criado", () => {
              onOpenChange(false);
              setF({ provider: "hotmart", name: "", campaignId: "", secret: "" });
            });
          }}
        >
          <Field label="Plataforma">
            <Select value={f.provider} onChange={(e) => setF({ ...f, provider: e.target.value as Hook["provider"] })}>
              <option value="hotmart">Hotmart</option>
              <option value="kiwify">Kiwify</option>
              <option value="generic">Genérico (HMAC)</option>
            </Select>
          </Field>
          <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Ex.: Hotmart — Guia renda extra" required /></Field>
          <Field label={f.provider === "generic" ? "Segredo (vazio = gerar automaticamente)" : f.provider === "hotmart" ? "Hottok da Hotmart" : "Token do webhook da Kiwify"}>
            <Input value={f.secret} onChange={(e) => setF({ ...f, secret: e.target.value })} type="password" autoComplete="off" />
          </Field>
          <Field label="Campanha de fallback" hint="Usada quando a venda chega sem sessão rastreada.">
            <Select value={f.campaignId} onChange={(e) => setF({ ...f, campaignId: e.target.value })}>
              <option value="">Nenhuma (somente vendas com sessão)</option>
              {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Button type="submit" className="w-full" loading={a.pending}>Criar endpoint</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

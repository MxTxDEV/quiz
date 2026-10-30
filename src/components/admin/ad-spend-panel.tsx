"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/misc";
import { addAdSpendAction, deleteAdSpendAction, manualPurchaseAction } from "@/app/(admin)/campaigns/actions";
import { formatMoney, parseMoneyToCents } from "@/lib/utils";

type Spend = { id: string; date: string; amountCents: number; source: string; note: string };

export function AdSpendPanel({ campaignId, rows, canEdit, today }: { campaignId: string; rows: Spend[]; canEdit: boolean; today: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ date: today, amount: "", source: "meta", note: "" });
  return (
    <div className="space-y-4">
      {canEdit && (
        <form
          className="grid gap-3 sm:grid-cols-[140px_120px_120px_1fr_auto] items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const amountCents = parseMoneyToCents(f.amount);
            if (!amountCents) return void toast.error("Informe o valor investido");
            start(async () => {
              const res = await addAdSpendAction({ campaignId, date: f.date, amountCents, source: f.source, note: f.note });
              if (!res.ok) return void toast.error(res.error);
              toast.success("Investimento registrado");
              setF({ ...f, amount: "", note: "" });
              router.refresh();
            });
          }}
        >
          <Field label="Data"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></Field>
          <Field label="Valor (R$)"><Input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} placeholder="150,00" /></Field>
          <Field label="Origem">
            <Select value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
              <option value="meta">Meta Ads</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok Ads</option>
              <option value="outro">Outro</option>
            </Select>
          </Field>
          <Field label="Observação"><Input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /></Field>
          <Button type="submit" loading={pending}>Adicionar</Button>
        </form>
      )}
      {rows.length > 0 ? (
        <Table>
          <thead><tr><Th>Data</Th><Th>Origem</Th><Th>Observação</Th><Th className="text-right">Valor</Th><Th className="w-10" /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td className="tabular-nums">{r.date.split("-").reverse().join("/")}</Td>
                <Td>{r.source}</Td>
                <Td className="text-muted-foreground">{r.note || "—"}</Td>
                <Td className="text-right tabular-nums">{formatMoney(r.amountCents)}</Td>
                <Td>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir"
                      onClick={() =>
                        start(async () => {
                          const res = await deleteAdSpendAction(campaignId, r.id);
                          if (!res.ok) return void toast.error(res.error);
                          router.refresh();
                        })
                      }
                    >
                      <Trash2 className="text-muted-foreground" />
                    </Button>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="text-[13px] text-muted-foreground">Nenhum investimento lançado. CPA e ROAS dependem destes valores.</p>
      )}
    </div>
  );
}

export function ManualPurchaseForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState({ externalId: "", amount: "" });
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_140px_auto] items-end"
      onSubmit={(e) => {
        e.preventDefault();
        const amountCents = parseMoneyToCents(f.amount);
        if (amountCents == null) return void toast.error("Informe o valor");
        if (!confirm("Registrar venda confirmada manualmente? Use apenas para vendas conferidas na plataforma de pagamento.")) return;
        start(async () => {
          const res = await manualPurchaseAction({ campaignId, externalId: f.externalId, amountCents });
          if (!res.ok) return void toast.error(res.error);
          toast.success("Venda registrada");
          setF({ externalId: "", amount: "" });
          router.refresh();
        });
      }}
    >
      <Field label="ID da transação na plataforma"><Input value={f.externalId} onChange={(e) => setF({ ...f, externalId: e.target.value })} required /></Field>
      <Field label="Valor (R$)"><Input inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
      <Button type="submit" variant="outline" loading={pending}>Registrar</Button>
    </form>
  );
}

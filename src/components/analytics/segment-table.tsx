import type { SegmentRow } from "@/lib/analytics/queries";
import { ratio } from "@/lib/analytics/metrics";
import { Table, Td, Th } from "@/components/ui/misc";
import { formatMoney, formatNumber, formatPercent } from "@/lib/utils";

export function SegmentTable({ rows, label, base = "visitors", labelFor }: { rows: SegmentRow[]; label: string; base?: "visitors" | "completed"; labelFor?: (k: string) => string }) {
  if (!rows.length) return <p className="py-6 text-center text-[13px] text-muted-foreground">Sem dados no período.</p>;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{label}</Th>
          <Th className="text-right">{base === "visitors" ? "Visitantes" : "Concluídos"}</Th>
          {base === "visitors" && <Th className="text-right">Concluídos</Th>}
          <Th className="text-right">Cliques checkout</Th>
          <Th className="text-right">Vendas</Th>
          <Th className="text-right">Receita</Th>
          <Th className="text-right">Conversão</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <Td className="font-medium">{labelFor ? labelFor(r.key) : r.key}</Td>
            <Td className="text-right tabular-nums">{formatNumber(base === "visitors" ? r.visitors : r.completed)}</Td>
            {base === "visitors" && <Td className="text-right tabular-nums">{formatNumber(r.completed)}</Td>}
            <Td className="text-right tabular-nums">{formatNumber(r.checkoutClicks)}</Td>
            <Td className="text-right tabular-nums">{formatNumber(r.purchases)}</Td>
            <Td className="text-right tabular-nums">{formatMoney(r.revenueCents)}</Td>
            <Td className="text-right tabular-nums">{formatPercent(ratio(r.purchases, base === "visitors" ? r.visitors : r.completed), 2)}</Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

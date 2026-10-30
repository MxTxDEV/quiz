"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyPoint } from "@/lib/analytics/queries";

const palette = { visitors: "#4f46e5", completed: "#0ea5e9", purchases: "#16a34a" };
const axis = { fontSize: 11, fill: "#6b6b76" };
const tooltipStyle = { fontSize: 12, borderRadius: 8, border: "1px solid #e7e7ea", boxShadow: "0 4px 12px rgba(0,0,0,.06)" };

const fmtDay = (d: string) => {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
};

export function TrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="#f0f0f2" vertical={false} />
        <XAxis dataKey="day" tickFormatter={fmtDay} tick={axis} tickLine={false} axisLine={false} minTickGap={20} />
        <YAxis allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={(l) => fmtDay(String(l))} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="visitors" name="Visitantes" stroke={palette.visitors} strokeWidth={2} dot={data.length <= 31 ? { r: 2 } : false} isAnimationActive={false} />
        <Line type="monotone" dataKey="completed" name="Concluídos" stroke={palette.completed} strokeWidth={2} dot={data.length <= 31 ? { r: 2 } : false} isAnimationActive={false} />
        <Line type="monotone" dataKey="purchases" name="Vendas" stroke={palette.purchases} strokeWidth={2} dot={data.length <= 31 ? { r: 2 } : false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CompareChart({ data }: { data: { name: string; visitors: number; completed: number; purchases: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44 + 40)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barGap={2}>
        <CartesianGrid stroke="#f0f0f2" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={axis} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="name" width={140} tick={axis} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f6f6f7" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="visitors" name="Visitantes" fill={palette.visitors} radius={[0, 3, 3, 0]} barSize={8} isAnimationActive={false} />
        <Bar dataKey="completed" name="Concluídos" fill={palette.completed} radius={[0, 3, 3, 0]} barSize={8} isAnimationActive={false} />
        <Bar dataKey="purchases" name="Vendas" fill={palette.purchases} radius={[0, 3, 3, 0]} barSize={8} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function FunnelBars({ steps }: { steps: { label: string; value: number }[] }) {
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const rate = prev ? s.value / prev : null;
        return (
          <div key={s.label} className="grid grid-cols-[140px_1fr_90px] items-center gap-3 text-[13px]">
            <span className="text-muted-foreground truncate">{s.label}</span>
            <div className="h-6 rounded bg-muted overflow-hidden">
              <div className="h-full rounded bg-accent/80 transition-all" style={{ width: `${(s.value / max) * 100}%` }} />
            </div>
            <span className="tabular-nums text-right">
              {s.value.toLocaleString("pt-BR")}
              {rate != null && <span className="text-muted-foreground text-[11px] ml-1">({(rate * 100).toFixed(0)}%)</span>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = ""): string {
  const rand =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12).padEnd(10, "0");
  return prefix ? `${prefix}_${rand}` : rand;
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function formatMoney(cents: number | null | undefined, currency = "BRL"): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function formatPercent(ratio: number | null | undefined, digits = 1): string {
  if (ratio == null) return "—";
  return `${(ratio * 100).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(d));
}

/** "197,90" | "197.90" | "1.997,00" → centavos */
export function parseMoneyToCents(input: string): number | null {
  const s = input.trim().replace(/[^\d.,]/g, "");
  if (!s) return null;
  const normalized = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s;
  const n = Number(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

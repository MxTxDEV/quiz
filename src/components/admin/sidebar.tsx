"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  FileText,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  LogOut,
  Megaphone,
  Menu,
  Plug,
  Settings,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/(auth)/actions";
import type { SessionUser } from "@/lib/auth/session";

const nav = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/campaigns", label: "Campanhas", icon: Megaphone },
  { href: "/products", label: "Produtos", icon: Boxes },
  { href: "/quiz-builder", label: "Quiz Builder", icon: ListChecks },
  { href: "/sales-pages", label: "Páginas de vendas", icon: FileText },
  { href: "/templates", label: "Modelos", icon: LayoutTemplate },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/integrations", label: "Integrações", icon: Plug },
  { href: "/settings", label: "Configurações", icon: Settings },
];

const roleLabel = { owner: "Proprietário", editor: "Editor", viewer: "Leitura" } as const;

export function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 flex h-12 items-center justify-between border-b bg-card px-4">
        <Brand />
        <button onClick={() => setOpen(true)} aria-label="Abrir menu" className="p-1.5 rounded-md hover:bg-muted">
          <Menu className="size-5" />
        </button>
      </div>
      {open && <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setOpen(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r bg-card transition-transform lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <Brand />
          <button onClick={() => setOpen(false)} className="lg:hidden p-1 rounded-md hover:bg-muted" aria-label="Fechar menu">
            <X className="size-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-muted grid place-items-center text-xs font-semibold uppercase">
              {(user.name || user.email).slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{user.name || user.email}</p>
              <p className="truncate text-[11px] text-muted-foreground">{roleLabel[user.role]}</p>
            </div>
            <form action={logoutAction}>
              <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer" aria-label="Sair" title="Sair">
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="size-6 rounded-md bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold">F</div>
      <span className="text-sm font-semibold tracking-tight">FunnelOS</span>
    </Link>
  );
}

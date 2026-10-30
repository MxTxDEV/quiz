"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, FilePlus2, LayoutTemplate, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { createCampaignAction } from "@/app/(admin)/campaigns/actions";
import { saveProductAction } from "@/app/(admin)/products/actions";
import { cn, parseMoneyToCents, slugify } from "@/lib/utils";

type Tpl = { id: string; name: string; description: string; category: string; isBuiltin: boolean; questionCount: number };
type Prod = { id: string; name: string };

export function NewCampaignForm({ templates, products: initialProducts, initialTemplateId }: { templates: Tpl[]; products: Prod[]; initialTemplateId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"scratch" | "template">(initialTemplateId ? "template" : "scratch");
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId ?? templates[0]?.id ?? null);
  const [products, setProducts] = useState(initialProducts);
  const [f, setF] = useState({ name: "", slug: "", slugTouched: false, description: "", productId: initialProducts[0]?.id ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [prodOpen, setProdOpen] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await createCampaignAction({
        name: f.name,
        slug: f.slug,
        description: f.description,
        productId: f.productId || null,
        templateId: mode === "template" ? templateId : null,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? { slug: res.error.includes("slug") ? res.error : "" });
        return void toast.error(res.error);
      }
      toast.success("Campanha criada");
      router.push(`/campaigns/${res.data.id}/quiz`);
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          { key: "scratch" as const, icon: FilePlus2, title: "Começar do zero", desc: "Estrutura vazia, com um resultado padrão e página de vendas básica." },
          { key: "template" as const, icon: LayoutTemplate, title: "Duplicar um modelo", desc: "Copia perguntas, regras, perfis e página de vendas de um modelo." },
        ].map((o) => (
          <button
            type="button"
            key={o.key}
            onClick={() => setMode(o.key)}
            className={cn("text-left rounded-lg border bg-card p-4 transition-colors cursor-pointer", mode === o.key ? "border-accent ring-2 ring-accent/15" : "hover:bg-muted/40")}
          >
            <o.icon className="size-5 text-accent mb-2" />
            <p className="text-sm font-medium">{o.title}</p>
            <p className="text-[13px] text-muted-foreground mt-0.5">{o.desc}</p>
          </button>
        ))}
      </div>

      {mode === "template" && (
        <Card>
          <CardHeader><CardTitle>Escolha o modelo</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => setTemplateId(t.id)}
                className={cn("relative text-left rounded-md border p-3 cursor-pointer", templateId === t.id ? "border-accent bg-accent-soft/40" : "hover:bg-muted/40")}
              >
                {templateId === t.id && <Check className="absolute right-2 top-2 size-4 text-accent" />}
                <p className="text-[13px] font-medium pr-5">{t.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                <div className="mt-2 flex gap-1.5">
                  <Badge>{t.questionCount} perguntas</Badge>
                  {!t.isBuiltin && <Badge tone="accent">Seu modelo</Badge>}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Dados da campanha</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome interno" error={errors.name}>
            <Input
              value={f.name}
              required
              placeholder="Ex.: Renda extra — Meta Ads outubro"
              onChange={(e) => setF((s) => ({ ...s, name: e.target.value, slug: s.slugTouched ? s.slug : slugify(e.target.value) }))}
            />
          </Field>
          <Field label="Slug (URL pública)" error={errors.slug} hint={`/q/${f.slug || "seu-slug"}`}>
            <Input value={f.slug} required onChange={(e) => setF({ ...f, slug: slugify(e.target.value), slugTouched: true })} />
          </Field>
          <Field label="Produto associado" hint="A oferta da campanha é preenchida com os dados do produto.">
            <div className="flex gap-2">
              <Select value={f.productId} onChange={(e) => setF({ ...f, productId: e.target.value })}>
                <option value="">Sem produto</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" aria-label="Cadastrar produto" onClick={() => setProdOpen(true)}>
                <Plus />
              </Button>
            </div>
          </Field>
          <Field label="Descrição">
            <Textarea rows={1} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </Field>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={mode === "template" && !templateId}>Criar campanha</Button>
      </div>
      <QuickProductDialog
        open={prodOpen}
        onOpenChange={setProdOpen}
        onCreated={(p) => {
          setProducts((ps) => [p, ...ps]);
          setF((s) => ({ ...s, productId: p.id }));
        }}
      />
    </form>
  );
}

function QuickProductDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (p: Prod) => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: "", price: "", checkoutUrl: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Cadastrar produto" description="Você pode completar benefícios, bônus e garantia depois, em Produtos.">
        <div className="space-y-3">
          <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Preço (R$)"><Input inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} placeholder="97,00" /></Field>
          <Field label="URL do checkout"><Input value={f.checkoutUrl} onChange={(e) => setF({ ...f, checkoutUrl: e.target.value })} placeholder="https://..." /></Field>
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await saveProductAction(null, { name: f.name, priceCents: parseMoneyToCents(f.price) ?? 0, checkoutUrl: f.checkoutUrl });
                if (!res.ok) return void toast.error(res.error);
                onCreated({ id: res.data.id, name: f.name });
                setF({ name: "", price: "", checkoutUrl: "" });
                onOpenChange(false);
                toast.success("Produto cadastrado");
              })
            }
          >
            Cadastrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

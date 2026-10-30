"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ObjectListEditor, StringListEditor } from "@/components/admin/list-editor";
import { saveProductAction, deleteProductAction } from "@/app/(admin)/products/actions";
import type { Product } from "@/lib/db/schema";
import { centsToInput, parseMoneyToCents } from "@/lib/utils";

export function ProductForm({ product, canEdit }: { product?: Product; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [f, setF] = useState({
    name: product?.name ?? "",
    coverImageUrl: product?.coverImageUrl ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "",
    price: centsToInput(product?.priceCents ?? null),
    referencePrice: centsToInput(product?.referencePriceCents ?? null),
    referencePriceNote: product?.referencePriceNote ?? "",
    checkoutUrl: product?.checkoutUrl ?? "",
    benefits: product?.benefits ?? [],
    deliverables: product?.deliverables ?? [],
    bonuses: (product?.bonuses ?? []).map((b) => ({ title: b.title, description: b.description })),
    guarantee: product?.guarantee ?? "",
    status: product?.status ?? "active",
  });
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceCents = parseMoneyToCents(f.price);
    if (priceCents == null) {
      setErrors({ priceCents: "Informe o preço" });
      return;
    }
    start(async () => {
      const res = await saveProductAction(product?.id ?? null, {
        name: f.name,
        coverImageUrl: f.coverImageUrl,
        description: f.description,
        category: f.category,
        priceCents,
        referencePriceCents: parseMoneyToCents(f.referencePrice),
        referencePriceNote: f.referencePriceNote,
        checkoutUrl: f.checkoutUrl,
        benefits: f.benefits.map((s) => s.trim()).filter(Boolean),
        deliverables: f.deliverables.map((s) => s.trim()).filter(Boolean),
        bonuses: f.bonuses.filter((b) => b.title.trim()),
        guarantee: f.guarantee,
        status: f.status as "active" | "inactive",
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      setErrors({});
      toast.success("Produto salvo");
      if (!product) router.push(`/products/${res.data.id}`);
      else router.refresh();
    });
  };

  const remove = () => {
    if (!product || !confirm("Excluir este produto definitivamente?")) return;
    start(async () => {
      const res = await deleteProductAction(product.id);
      if (!res.ok) return void toast.error(res.error);
      toast.success("Produto excluído");
      router.push("/products");
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-3">
      <fieldset disabled={!canEdit} className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Informações</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Nome do produto" error={errors.name}>
              <Input value={f.name} onChange={(e) => set("name", e.target.value)} required />
            </Field>
            <Field label="Descrição" error={errors.description}>
              <Textarea rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Categoria">
                <Input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="Ex.: Curso, E-book" />
              </Field>
              <Field label="Imagem de capa (URL)" error={errors.coverImageUrl}>
                <Input value={f.coverImageUrl} onChange={(e) => set("coverImageUrl", e.target.value)} placeholder="https://..." />
              </Field>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Benefícios</CardTitle></CardHeader>
          <CardContent><StringListEditor value={f.benefits} onChange={(v) => set("benefits", v)} placeholder="Ex.: Aprenda a precificar" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conteúdo entregue</CardTitle></CardHeader>
          <CardContent><StringListEditor value={f.deliverables} onChange={(v) => set("deliverables", v)} placeholder="Ex.: Módulo 1 — Primeiros passos" /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bônus</CardTitle></CardHeader>
          <CardContent>
            <ObjectListEditor
              value={f.bonuses}
              onChange={(v) => set("bonuses", v)}
              empty={{ title: "", description: "" }}
              fields={[{ key: "title", label: "Título do bônus" }, { key: "description", label: "Descrição", multiline: true }]}
              addLabel="Adicionar bônus"
            />
          </CardContent>
        </Card>
      </fieldset>
      <fieldset disabled={!canEdit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Preço e checkout</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Preço atual (R$)" error={errors.priceCents}>
              <Input inputMode="decimal" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="97,00" required />
            </Field>
            <Field label="Preço de referência (R$)" hint="Use apenas se o produto realmente foi vendido por este valor." error={errors.referencePriceCents}>
              <Input inputMode="decimal" value={f.referencePrice} onChange={(e) => set("referencePrice", e.target.value)} placeholder="Opcional" />
            </Field>
            {f.referencePrice && (
              <Field label="Justificativa do preço de referência" error={errors.referencePriceNote}>
                <Input value={f.referencePriceNote} onChange={(e) => set("referencePriceNote", e.target.value)} placeholder="Ex.: preço praticado até 01/09/2026" />
              </Field>
            )}
            <Field label="URL do checkout" error={errors.checkoutUrl}>
              <Input value={f.checkoutUrl} onChange={(e) => set("checkoutUrl", e.target.value)} placeholder="https://pay.hotmart.com/..." />
            </Field>
            <Field label="Garantia" hint="Descreva a política real do produto.">
              <Textarea rows={3} value={f.guarantee} onChange={(e) => set("guarantee", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={f.status} onChange={(e) => set("status", e.target.value as "active")}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </Select>
            </Field>
          </CardContent>
        </Card>
        {canEdit && (
          <div className="flex gap-2">
            <Button type="submit" loading={pending} className="flex-1">Salvar produto</Button>
            {product && <Button type="button" variant="danger-ghost" onClick={remove}>Excluir</Button>}
          </div>
        )}
      </fieldset>
    </form>
  );
}

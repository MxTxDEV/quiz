"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { ThemeEditor } from "@/components/admin/theme-editor";
import { SaveBar, useSection } from "@/components/admin/use-section";
import { updateCampaignMetaAction } from "@/app/(admin)/campaigns/actions";
import type { Theme } from "@/lib/domain/config";
import { formatDate, slugify } from "@/lib/utils";

type Props = {
  id: string;
  meta: { name: string; description: string; slug: string; productId: string | null };
  products: { id: string; name: string }[];
  theme: Theme;
  dates: { createdAt: string; publishedAt: string | null; updatedAt: string };
  canEdit: boolean;
};

export function CampaignGeneral({ id, meta, products, theme, dates, canEdit }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [f, setF] = useState(meta);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const t = useSection(id, "theme", theme);

  const saveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const res = await updateCampaignMetaAction(id, f);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        return void toast.error(res.error);
      }
      setErrors({});
      toast.success("Dados atualizados");
      router.refresh();
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados da campanha</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={saveMeta}>
              <fieldset disabled={!canEdit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Nome interno" error={errors.name}>
                  <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
                </Field>
                <Field label="Slug" error={errors.slug} hint="Alterar o slug muda a URL pública. Links antigos deixam de funcionar.">
                  <Input value={f.slug} onChange={(e) => setF({ ...f, slug: slugify(e.target.value) })} required />
                </Field>
                <Field label="Produto associado">
                  <Select value={f.productId ?? ""} onChange={(e) => setF({ ...f, productId: e.target.value || null })}>
                    <option value="">Sem produto</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
                <Field label="Descrição" className="sm:col-span-2">
                  <Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
                </Field>
                {canEdit && (
                  <div className="sm:col-span-2 flex justify-end">
                    <Button type="submit" size="sm" loading={pending}>Salvar dados</Button>
                  </div>
                )}
              </fieldset>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Aparência do quiz</CardTitle>
              <CardDescription>Cores, tipografia e formas usadas nas telas do quiz e do resultado.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <fieldset disabled={!canEdit}><ThemeEditor value={t.value} onChange={t.setValue} /></fieldset>
          </CardContent>
        </Card>
        <SaveBar dirty={t.dirty} pending={t.pending} onSave={t.save} disabled={!canEdit} />
      </div>
      <Card className="h-fit">
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-[13px]">
          <Row label="Criada em" value={formatDate(dates.createdAt)} />
          <Row label="Última edição" value={formatDate(dates.updatedAt)} />
          <Row label="Publicada em" value={formatDate(dates.publishedAt)} />
        </CardContent>
      </Card>
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between gap-2"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>
);

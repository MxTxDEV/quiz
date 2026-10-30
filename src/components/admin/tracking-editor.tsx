"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import { SaveBar, useSection } from "@/components/admin/use-section";
import type { Tracking } from "@/lib/domain/config";

export function TrackingEditor({ campaignId, value, global, canEdit, publicUrl }: { campaignId: string; value: Tracking; global: Tracking; canEdit: boolean; publicUrl: string }) {
  const s = useSection(campaignId, "tracking", value);
  const t = s.value;
  const set = (p: Partial<Tracking>) => s.setValue({ ...t, ...p });
  const hint = (v: string) => (v ? `Vazio = usa o global (${v})` : "Vazio = sem rastreamento");
  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Ferramentas de rastreamento</CardTitle>
              <CardDescription>Sobrescrevem as configurações globais de Integrações apenas nesta campanha.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Meta Pixel ID" hint={hint(global.metaPixelId)} error={s.errors["tracking.metaPixelId"]}>
              <Input value={t.metaPixelId} onChange={(e) => set({ metaPixelId: e.target.value.trim() })} placeholder="123456789012345" />
            </Field>
            <Field label="Google Analytics 4 (Measurement ID)" hint={hint(global.gaMeasurementId)} error={s.errors["tracking.gaMeasurementId"]}>
              <Input value={t.gaMeasurementId} onChange={(e) => set({ gaMeasurementId: e.target.value.trim().toUpperCase() })} placeholder="G-XXXXXXX" />
            </Field>
            <Field label="Google Tag Manager" hint={hint(global.gtmId)} error={s.errors["tracking.gtmId"]}>
              <Input value={t.gtmId} onChange={(e) => set({ gtmId: e.target.value.trim().toUpperCase() })} placeholder="GTM-XXXXXX" />
            </Field>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Links com UTM</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-[13px]">
            <p className="text-muted-foreground">Use UTMs nos anúncios para analisar a conversão por origem e criativo:</p>
            <code className="block break-all rounded-md bg-muted px-3 py-2 font-mono text-xs">
              {publicUrl}?utm_source=facebook&utm_medium=cpc&utm_campaign=NOME&utm_content=CRIATIVO
            </code>
          </CardContent>
        </Card>
        <SaveBar dirty={s.dirty} pending={s.pending} onSave={s.save} disabled={!canEdit} />
      </div>
      <div className="space-y-3">
        <Notice>
          Eventos enviados às plataformas: início do quiz, conclusão, lead (sem nome/e-mail), visualização da oferta e clique no checkout.
          <b> Nenhum dado pessoal é enviado.</b>
        </Notice>
        <Notice>O FunnelOS registra seus próprios eventos independentemente dessas ferramentas — os relatórios não dependem delas.</Notice>
      </div>
    </fieldset>
  );
}

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { SwitchRow } from "@/components/ui/switch";
import { Notice } from "@/components/ui/misc";
import { SaveBar, useSection } from "@/components/admin/use-section";
import type { LeadCapture } from "@/lib/domain/config";

export function LeadCaptureEditor({ campaignId, value, canEdit }: { campaignId: string; value: LeadCapture; canEdit: boolean }) {
  const s = useSection(campaignId, "leadCapture", value);
  const lc = s.value;
  const set = (p: Partial<LeadCapture>) => s.setValue({ ...lc, ...p });
  return (
    <fieldset disabled={!canEdit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Captura de leads</CardTitle>
              <CardDescription>Solicite apenas nome e e-mail — coleta mínima, com consentimento explícito.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Quando solicitar">
              <Select value={lc.mode} onChange={(e) => set({ mode: e.target.value as LeadCapture["mode"] })}>
                <option value="off">Não solicitar dados</option>
                <option value="before_result">Antes de mostrar o resultado</option>
                <option value="after_result">Junto com o resultado</option>
              </Select>
            </Field>
            {lc.mode !== "off" && (
              <>
                <SwitchRow label="Pedir o nome" description="Apenas o primeiro nome. Desative para pedir só o e-mail." checked={lc.askName} onCheckedChange={(v) => set({ askName: v })} />
                <SwitchRow
                  label="Preenchimento obrigatório"
                  description="Quando desativado, o visitante pode continuar sem informar dados (recomendado)."
                  checked={lc.required}
                  onCheckedChange={(v) => set({ required: v })}
                />
                {lc.required && (
                  <Field label="Justificativa comercial e legal" hint="Obrigatória para publicar. Ex.: envio de proposta personalizada por e-mail.">
                    <Textarea rows={2} value={lc.requiredReason} onChange={(e) => set({ requiredReason: e.target.value })} />
                  </Field>
                )}
                <Field label="Título"><Input value={lc.title} onChange={(e) => set({ title: e.target.value })} /></Field>
                <Field label="Descrição"><Textarea rows={2} value={lc.description} onChange={(e) => set({ description: e.target.value })} /></Field>
                <Field label="Texto de consentimento" hint="O visitante precisa marcar esta caixa. O texto aceito é registrado junto com a data.">
                  <Textarea rows={3} value={lc.consentText} onChange={(e) => set({ consentText: e.target.value })} />
                </Field>
              </>
            )}
          </CardContent>
        </Card>
        <SaveBar dirty={s.dirty} pending={s.pending} onSave={s.save} disabled={!canEdit} />
      </div>
      <div className="space-y-3">
        <Notice>
          <b>LGPD</b> — cada lead guarda o texto de consentimento aceito, a data e um hash do IP (não o IP). Exclusões são feitas em <b>Leads</b>,
          que remove nome e e-mail definitivamente.
        </Notice>
        <Notice>A Política de Privacidade exibida no formulário é configurada em Configurações.</Notice>
      </div>
    </fieldset>
  );
}

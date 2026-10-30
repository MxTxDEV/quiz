"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, Copy, Eye, Link2, MoreHorizontal, Pause, Rocket, Save, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dropdown, DropdownContent, DropdownItem, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/misc";
import {
  deleteCampaignAction,
  duplicateCampaignAction,
  publishCampaignAction,
  saveAsTemplateAction,
  setStatusAction,
} from "@/app/(admin)/campaigns/actions";
import type { CampaignStatus } from "@/lib/db/schema";

export function usePublish() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [issues, setIssues] = useState<string[]>([]);
  const publish = (id: string) =>
    start(async () => {
      const res = await publishCampaignAction(id);
      if (!res.ok) return void toast.error(res.error);
      if (!res.data.ok) {
        setIssues(res.data.issues);
        return;
      }
      toast.success("Campanha publicada");
      router.refresh();
    });
  const dialog = (
    <Dialog open={issues.length > 0} onOpenChange={(o) => !o && setIssues([])}>
      <DialogContent title="Ainda não dá para publicar" description="Corrija os pontos abaixo e tente novamente.">
        <ul className="space-y-2">
          {issues.map((i) => (
            <li key={i}><Notice tone="warning">{i}</Notice></li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
  return { publish, pending, dialog };
}

export function CampaignMenu({
  id,
  slug,
  name,
  status,
  publicUrl,
  canDelete,
}: {
  id: string;
  slug: string;
  name: string;
  status: CampaignStatus;
  publicUrl: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [, start] = useTransition();
  const { publish, dialog } = usePublish();
  const [tplOpen, setTplOpen] = useState(false);

  const act = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(msg);
      router.refresh();
    });

  return (
    <>
      <Dropdown>
        <DropdownTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Ações"><MoreHorizontal /></Button>
        </DropdownTrigger>
        <DropdownContent>
          <DropdownItem asChild><Link href={`/preview/${id}`} target="_blank"><Eye /> Visualizar</Link></DropdownItem>
          {status === "published" && (
            <DropdownItem
              onSelect={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Link copiado");
              }}
            >
              <Link2 /> Copiar link
            </DropdownItem>
          )}
          <DropdownSeparator />
          {status !== "published" && <DropdownItem onSelect={() => publish(id)}><Rocket /> Publicar</DropdownItem>}
          {status === "published" && <DropdownItem onSelect={() => act(() => setStatusAction(id, "paused"), "Campanha pausada")}><Pause /> Pausar</DropdownItem>}
          {status === "published" && <DropdownItem onSelect={() => act(() => setStatusAction(id, "draft"), "Campanha despublicada")}><Undo2 /> Despublicar</DropdownItem>}
          <DropdownItem
            onSelect={() =>
              start(async () => {
                const res = await duplicateCampaignAction(id);
                if (!res.ok) return void toast.error(res.error);
                toast.success("Campanha duplicada");
                router.push(`/campaigns/${res.data.id}`);
              })
            }
          >
            <Copy /> Duplicar
          </DropdownItem>
          <DropdownItem onSelect={() => setTplOpen(true)}><Save /> Salvar como modelo</DropdownItem>
          {status !== "archived" && <DropdownItem onSelect={() => act(() => setStatusAction(id, "archived"), "Campanha arquivada")}><Archive /> Arquivar</DropdownItem>}
          {status === "archived" && <DropdownItem onSelect={() => act(() => setStatusAction(id, "draft"), "Campanha restaurada")}><Undo2 /> Restaurar</DropdownItem>}
          {canDelete && (
            <>
              <DropdownSeparator />
              <DropdownItem
                danger
                onSelect={() => {
                  const typed = prompt(`Excluir definitivamente "${name}" e todos os seus dados (visitas, eventos, leads)?\nDigite o slug "${slug}" para confirmar.`);
                  if (typed !== slug) return;
                  start(async () => {
                    const res = await deleteCampaignAction(id);
                    if (!res.ok) return void toast.error(res.error);
                    toast.success("Campanha excluída");
                    router.push("/campaigns");
                  });
                }}
              >
                <Trash2 /> Excluir
              </DropdownItem>
            </>
          )}
        </DropdownContent>
      </Dropdown>
      {dialog}
      <SaveTemplateDialog id={id} defaultName={name} open={tplOpen} onOpenChange={setTplOpen} />
    </>
  );
}

function SaveTemplateDialog({ id, defaultName, open, onOpenChange }: { id: string; defaultName: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ name: defaultName, description: "", category: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Salvar como modelo" description="O modelo guarda quiz, perfis, regras, página de vendas e configurações desta campanha.">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await saveAsTemplateAction(id, f);
              if (!res.ok) return void toast.error(res.error);
              toast.success("Modelo salvo");
              onOpenChange(false);
            });
          }}
        >
          <Field label="Nome do modelo"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="Categoria"><Input value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /></Field>
          <Field label="Descrição"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Button type="submit" loading={pending} className="w-full">Salvar modelo</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Table, Td, Th } from "@/components/ui/misc";
import { changePasswordAction, createUserAction, deleteUserAction, savePrivacyAction, updateRoleAction } from "@/app/(admin)/settings/actions";

type Role = "owner" | "editor" | "viewer";
const roles: { value: Role; label: string; desc: string }[] = [
  { value: "owner", label: "Proprietário", desc: "Tudo, inclusive usuários, integrações, exclusões e dados pessoais" },
  { value: "editor", label: "Editor", desc: "Cria e edita campanhas, produtos e modelos" },
  { value: "viewer", label: "Leitura", desc: "Apenas visualiza" },
];

function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const exec = (fn: () => Promise<{ ok: boolean; error?: string }>, msg: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (!res.ok) return void toast.error(res.error);
      toast.success(msg);
      after?.();
      router.refresh();
    });
  return { pending, exec };
}

export function PrivacyCard({ value, canEdit }: { value: { controllerName: string; contactEmail: string; policyText: string }; canEdit: boolean }) {
  const [f, setF] = useState(value);
  const a = useAct();
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Política de Privacidade</CardTitle>
          <CardDescription>Publicada em /privacidade e vinculada em todos os formulários de lead e rodapés.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!canEdit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Controlador dos dados (nome ou empresa)"><Input value={f.controllerName} onChange={(e) => setF({ ...f, controllerName: e.target.value })} /></Field>
            <Field label="E-mail para solicitações LGPD"><Input type="email" value={f.contactEmail} onChange={(e) => setF({ ...f, contactEmail: e.target.value })} /></Field>
          </div>
          <Field label="Texto da política" hint="Vazio = texto padrão resumido. Recomendado revisar com assessoria jurídica.">
            <Textarea rows={8} value={f.policyText} onChange={(e) => setF({ ...f, policyText: e.target.value })} />
          </Field>
          {canEdit && <div className="flex justify-end"><Button size="sm" loading={a.pending} onClick={() => a.exec(() => savePrivacyAction(f), "Política salva")}>Salvar</Button></div>}
        </fieldset>
      </CardContent>
    </Card>
  );
}

export function UsersCard({ users, meId }: { users: { id: string; name: string; email: string; role: Role }[]; meId: string }) {
  const [f, setF] = useState({ name: "", email: "", password: "", role: "editor" as Role });
  const a = useAct();
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Usuários e permissões</CardTitle>
          <CardDescription>{roles.map((r) => `${r.label}: ${r.desc}`).join(" · ")}</CardDescription>
        </div>
      </CardHeader>
      <Table>
        <thead><tr><Th>Nome</Th><Th>E-mail</Th><Th>Papel</Th><Th className="w-10" /></tr></thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <Td className="font-medium">{u.name}{u.id === meId && <span className="text-muted-foreground font-normal"> (você)</span>}</Td>
              <Td>{u.email}</Td>
              <Td>
                <Select className="h-8 w-40" value={u.role} disabled={u.id === meId} onChange={(e) => a.exec(() => updateRoleAction(u.id, e.target.value as Role), "Papel atualizado")}>
                  {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
              </Td>
              <Td>
                {u.id !== meId && (
                  <Button variant="ghost" size="icon" aria-label="Excluir usuário" onClick={() => confirm(`Remover o acesso de ${u.email}?`) && a.exec(() => deleteUserAction(u.id), "Usuário removido")}>
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <CardContent className="border-t pt-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_140px_auto] items-end"
          onSubmit={(e) => {
            e.preventDefault();
            a.exec(() => createUserAction(f), "Usuário criado", () => setF({ name: "", email: "", password: "", role: "editor" }));
          }}
        >
          <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /></Field>
          <Field label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></Field>
          <Field label="Senha inicial"><Input type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required minLength={10} /></Field>
          <Field label="Papel">
            <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
              {roles.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </Field>
          <Button type="submit" loading={a.pending}>Adicionar</Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function PasswordCard() {
  const [f, setF] = useState({ current: "", next: "" });
  const a = useAct();
  return (
    <Card>
      <CardHeader><CardTitle>Alterar minha senha</CardTitle></CardHeader>
      <CardContent>
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-end"
          onSubmit={(e) => {
            e.preventDefault();
            a.exec(() => changePasswordAction(f.current, f.next), "Senha alterada", () => setF({ current: "", next: "" }));
          }}
        >
          <Field label="Senha atual"><Input type="password" autoComplete="current-password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required /></Field>
          <Field label="Nova senha (mín. 10)"><Input type="password" autoComplete="new-password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} required minLength={10} /></Field>
          <Button type="submit" variant="outline" loading={a.pending}>Alterar</Button>
        </form>
      </CardContent>
    </Card>
  );
}

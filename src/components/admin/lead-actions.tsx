"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { eraseByEmailAction, eraseLeadAction } from "@/app/(admin)/leads/actions";

export function EraseLeadButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      loading={pending}
      aria-label="Excluir dados pessoais"
      title="Excluir dados pessoais"
      onClick={() =>
        confirm("Excluir definitivamente nome e e-mail deste lead?") &&
        start(async () => {
          const res = await eraseLeadAction(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Dados pessoais excluídos");
          router.refresh();
        })
      }
    >
      {!pending && <Trash2 className="text-muted-foreground" />}
    </Button>
  );
}

export function EraseByEmailForm() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!confirm(`Excluir os dados pessoais de ${email} em todas as campanhas?`)) return;
        start(async () => {
          const res = await eraseByEmailAction(email);
          if (!res.ok) return void toast.error(res.error);
          toast.success(res.data ? `${res.data} registro(s) anonimizado(s)` : "Nenhum lead com este e-mail");
          setEmail("");
          router.refresh();
        });
      }}
    >
      <Input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" variant="danger" loading={pending}>Excluir dados</Button>
    </form>
  );
}

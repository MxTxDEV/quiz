"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTemplateAction, installBuiltinsAction } from "@/app/(admin)/templates/actions";

export function DeleteTemplateButton({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      loading={pending}
      aria-label="Excluir modelo"
      onClick={() =>
        confirm(`Excluir o modelo "${name}"? Campanhas criadas a partir dele não são afetadas.`) &&
        start(async () => {
          const res = await deleteTemplateAction(id);
          if (!res.ok) return void toast.error(res.error);
          toast.success("Modelo excluído");
          router.refresh();
        })
      }
    >
      {!pending && <Trash2 className="text-muted-foreground" />}
    </Button>
  );
}

export function InstallBuiltinsButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await installBuiltinsAction();
          if (!res.ok) return void toast.error(res.error);
          toast.success(`${res.data} modelos prontos instalados`);
          router.refresh();
        })
      }
    >
      <Download /> Instalar modelos prontos
    </Button>
  );
}

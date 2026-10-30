import Link from "next/link";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { DeleteTemplateButton, InstallBuiltinsButton } from "@/components/admin/template-actions";
import { listTemplates } from "@/lib/services/templates";
import { parseConfig } from "@/lib/domain/config";
import { hasRole, requireUser } from "@/lib/auth/session";

export const metadata = { title: "Modelos" };

export default async function TemplatesPage() {
  const [user, rows] = await Promise.all([requireUser(), listTemplates()]);
  const canEdit = hasRole(user, "editor");
  const hasBuiltins = rows.some((r) => r.isBuiltin);
  return (
    <>
      <PageHeader
        title="Modelos"
        description="Pontos de partida reutilizáveis. Qualquer campanha pode ser salva como modelo pelo menu ⋯ da campanha."
        actions={canEdit && !hasBuiltins ? <InstallBuiltinsButton /> : undefined}
      />
      {rows.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="Nenhum modelo" description="Instale os 6 modelos prontos ou salve uma campanha como modelo." action={canEdit && <InstallBuiltinsButton />} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((t) => {
            const cfg = parseConfig(t.config);
            return (
              <div key={t.id} className="flex flex-col rounded-lg border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    {t.category && <p className="text-xs text-muted-foreground">{t.category}</p>}
                  </div>
                  {t.isBuiltin ? <Badge>Pronto</Badge> : <Badge tone="accent">Seu modelo</Badge>}
                </div>
                <p className="mt-2 flex-1 text-[13px] text-muted-foreground">{t.description || "—"}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge>{cfg.quiz.questions.length} perguntas</Badge>
                  <Badge>{cfg.profiles.length} perfis</Badge>
                  <Badge>{cfg.rules.length} regras</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  {canEdit && (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/campaigns/new?template=${t.id}`}>Usar modelo</Link>
                    </Button>
                  )}
                  {canEdit && !t.isBuiltin && <DeleteTemplateButton id={t.id} name={t.name} />}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

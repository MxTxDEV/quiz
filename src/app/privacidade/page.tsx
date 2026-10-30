import { getSetting } from "@/lib/services/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Política de Privacidade", robots: { index: true } };

export default async function PrivacyPage() {
  const p = await getSetting("privacy");
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Política de Privacidade</h1>
      {p.controllerName && <p className="mt-2 text-sm text-muted-foreground">Controlador dos dados: {p.controllerName}</p>}
      <div className="mt-6 space-y-4 text-[15px] leading-relaxed whitespace-pre-line">
        {p.policyText ||
          "Coletamos apenas as respostas do quiz e, se você optar por informá-los, seu nome e e-mail. Os dados são usados para exibir seu resultado e, com seu consentimento, para enviar comunicações relacionadas ao conteúdo. Não vendemos seus dados. Você pode solicitar acesso, correção ou exclusão a qualquer momento pelo contato abaixo."}
      </div>
      {p.contactEmail && (
        <p className="mt-8 text-sm">
          Para exercer seus direitos (acesso, correção, exclusão), escreva para{" "}
          <a className="underline" href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>.
        </p>
      )}
    </main>
  );
}

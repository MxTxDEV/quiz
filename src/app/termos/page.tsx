import { notFound } from "next/navigation";
import { getSetting } from "@/lib/services/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Termos de Uso" };

export default async function TermsPage() {
  const p = await getSetting("privacy");
  if (!p.termsText) notFound();
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-2xl font-bold tracking-tight">Termos de Uso</h1>
      {p.controllerName && (
        <p className="mt-2 text-sm text-muted-foreground">
          {p.controllerName}
          {p.document && ` · ${p.document}`}
        </p>
      )}
      <div className="mt-6 text-[15px] leading-relaxed whitespace-pre-line">{p.termsText}</div>
      {p.contactEmail && (
        <p className="mt-8 text-sm">
          Contato: <a className="underline" href={`mailto:${p.contactEmail}`}>{p.contactEmail}</a>
        </p>
      )}
    </main>
  );
}

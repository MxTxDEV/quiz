import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-dvh grid place-items-center px-6 text-center">
      <div>
        <p className="text-sm text-muted-foreground">404</p>
        <h1 className="mt-1 text-xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta página não existe ou não está mais disponível.</p>
        <Link href="/" className="mt-6 inline-block text-sm text-accent hover:underline">Voltar</Link>
      </div>
    </main>
  );
}

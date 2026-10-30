"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-[60dvh] grid place-items-center px-6 text-center">
      <div>
        <h1 className="text-lg font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">O erro foi registrado. Tente novamente.</p>
        <button onClick={reset} className="mt-5 text-sm text-accent hover:underline cursor-pointer">Tentar novamente</button>
      </div>
    </main>
  );
}

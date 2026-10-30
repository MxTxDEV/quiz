export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2 justify-center">
          <div className="size-7 rounded-md bg-primary text-primary-foreground grid place-items-center text-xs font-bold">F</div>
          <span className="font-semibold tracking-tight">FunnelOS</span>
        </div>
        {children}
      </div>
    </main>
  );
}

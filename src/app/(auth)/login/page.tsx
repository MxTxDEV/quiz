import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAnyUser, loginAction } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const configured = await hasAnyUser();
  return (
    <Card>
      <CardContent className="pt-6">
        <h1 className="text-lg font-semibold">Entrar</h1>
        <p className="text-[13px] text-muted-foreground mb-5">Acesse o painel administrativo.</p>
        {configured ? (
          <AuthForm
            action={loginAction}
            submitLabel="Entrar"
            fields={[
              { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
              { name: "password", label: "Senha", type: "password", autoComplete: "current-password" },
            ]}
          />
        ) : (
          <p className="text-[13px]">
            Nenhum administrador cadastrado.{" "}
            <Link href="/setup" className="text-accent font-medium hover:underline">
              Fazer configuração inicial
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

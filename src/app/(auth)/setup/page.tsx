import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { hasAnyUser, setupAction } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata = { title: "Configuração inicial" };
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  if (await hasAnyUser()) redirect("/login");
  const fields = [
    { name: "name", label: "Seu nome", autoComplete: "name" },
    { name: "email", label: "E-mail", type: "email", autoComplete: "email" },
    { name: "password", label: "Senha (mín. 10 caracteres)", type: "password", autoComplete: "new-password" },
  ];
  if (process.env.SETUP_TOKEN) fields.push({ name: "token", label: "Token de configuração (SETUP_TOKEN)", type: "password", autoComplete: "off" });
  return (
    <Card>
      <CardContent className="pt-6">
        <h1 className="text-lg font-semibold">Configuração inicial</h1>
        <p className="text-[13px] text-muted-foreground mb-5">Crie a conta do administrador principal.</p>
        <AuthForm action={setupAction} submitLabel="Criar conta e entrar" fields={fields} />
      </CardContent>
    </Card>
  );
}

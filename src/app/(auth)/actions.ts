"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

export type AuthState = { error?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha").max(200),
});

// hash fixo usado quando o e-mail não existe, para tempo de resposta constante
const DUMMY_HASH = "scrypt$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==";

export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const ip = clientIp(await headers());
  const limit = rateLimit(`login:${ip}`, 10, 15 * 60_000);
  const limitEmail = rateLimit(`login-email:${parsed.data.email}`, 8, 15 * 60_000);
  if (!limit.ok || !limitEmail.ok) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { error: "E-mail ou senha incorretos." };
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

const setupSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(10, "A senha precisa de pelo menos 10 caracteres").max(200),
  token: z.string().optional(),
});

export async function hasAnyUser() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
  return count > 0;
}

/** Cria o primeiro administrador. Só funciona enquanto não existir nenhum usuário. */
export async function setupAction(_: AuthState, form: FormData): Promise<AuthState> {
  const ip = clientIp(await headers());
  if (!rateLimit(`setup:${ip}`, 5, 15 * 60_000).ok) return { error: "Muitas tentativas. Aguarde alguns minutos." };
  if (await hasAnyUser()) return { error: "A configuração inicial já foi concluída." };
  const parsed = setupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const required = process.env.SETUP_TOKEN;
  if (required && parsed.data.token !== required) return { error: "Token de configuração inválido." };

  const passwordHash = await hashPassword(parsed.data.password);
  const inserted = await db.transaction(async (tx) => {
    await tx.execute(sql`lock table users in exclusive mode`);
    const [{ count }] = await tx.select({ count: sql<number>`count(*)::int` }).from(users);
    if (count > 0) return null;
    const [u] = await tx
      .insert(users)
      .values({ name: parsed.data.name, email: parsed.data.email, passwordHash, role: "owner" })
      .returning();
    return u;
  });
  if (!inserted) return { error: "A configuração inicial já foi concluída." };
  await createSession(inserted.id);
  redirect("/dashboard");
}

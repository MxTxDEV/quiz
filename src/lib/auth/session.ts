import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { authSessions, users, type User } from "@/lib/db/schema";

export const SESSION_COOKIE = "fos_session";
const SESSION_DAYS = 30;

export type Role = User["role"];
export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(authSessions).values({ id: hashToken(token), userId, expiresAt });
  // limpeza oportunista de sessões expiradas
  await db.delete(authSessions).where(lt(authSessions.expiresAt, new Date()));
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.delete(authSessions).where(eq(authSessions.id, hashToken(token)));
  jar.delete(SESSION_COOKIE);
}

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(authSessions)
    .innerJoin(users, eq(users.id, authSessions.userId))
    .where(and(eq(authSessions.id, hashToken(token)), gt(authSessions.expiresAt, new Date())))
    .limit(1);
  return row ?? null;
});

const rank: Record<Role, number> = { viewer: 0, editor: 1, owner: 2 };

export function hasRole(user: SessionUser, min: Role) {
  return rank[user.role] >= rank[min];
}

/** Para páginas: redireciona ao login se não autenticado. */
export async function requireUser(min: Role = "viewer"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!hasRole(user, min)) redirect("/dashboard?erro=permissao");
  return user;
}

export class AuthError extends Error {}

/** Para Server Actions: lança erro em vez de redirecionar. */
export async function assertUser(min: Role = "editor"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Sessão expirada. Entre novamente.");
  if (!hasRole(user, min)) throw new AuthError("Você não tem permissão para esta ação.");
  return user;
}

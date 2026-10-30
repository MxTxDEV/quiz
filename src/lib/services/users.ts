import { z } from "zod";
import { and, asc, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { authSessions, errorLogs, users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const userInputSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(10, "A senha precisa de pelo menos 10 caracteres").max(200),
  role: z.enum(["owner", "editor", "viewer"]),
});

export async function listUsers() {
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt }).from(users).orderBy(asc(users.createdAt));
}

export async function createUser(input: z.input<typeof userInputSchema>) {
  const data = userInputSchema.parse(input);
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email));
  if (exists) throw new Error("Já existe um usuário com este e-mail.");
  await db.insert(users).values({ name: data.name, email: data.email, role: data.role, passwordHash: await hashPassword(data.password) });
}

async function ownerCount(exceptId: string) {
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(users).where(and(eq(users.role, "owner"), ne(users.id, exceptId)));
  return n;
}

export async function updateUserRole(id: string, role: "owner" | "editor" | "viewer") {
  if (role !== "owner" && (await ownerCount(id)) === 0) throw new Error("É preciso manter pelo menos um proprietário.");
  await db.update(users).set({ role }).where(eq(users.id, id));
  await db.delete(authSessions).where(eq(authSessions.userId, id)); // força novo login com o novo papel
}

export async function deleteUser(id: string, actorId: string) {
  if (id === actorId) throw new Error("Você não pode excluir a si mesmo.");
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
  if (u?.role === "owner" && (await ownerCount(id)) === 0) throw new Error("É preciso manter pelo menos um proprietário.");
  await db.delete(users).where(eq(users.id, id));
}

export async function changePassword(userId: string, current: string, next: string) {
  const pwd = z.string().min(10, "A nova senha precisa de pelo menos 10 caracteres").max(200).parse(next);
  const [u] = await db.select({ hash: users.passwordHash }).from(users).where(eq(users.id, userId));
  if (!u || !(await verifyPassword(current, u.hash))) throw new Error("Senha atual incorreta.");
  await db.update(users).set({ passwordHash: await hashPassword(pwd) }).where(eq(users.id, userId));
}

export async function recentErrors(limit = 20) {
  return db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit);
}

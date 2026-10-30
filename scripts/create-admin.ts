import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, sql } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

const [email, password, name = "Administrador"] = process.argv.slice(2);
if (!email || !password || password.length < 10) {
  console.error("Uso: npm run admin:create -- <email> <senha (mín. 10 caracteres)> [nome]");
  process.exit(1);
}
const passwordHash = await hashPassword(password);
const normalized = email.trim().toLowerCase();
const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, normalized));
if (existing) {
  await db.update(users).set({ passwordHash, role: "owner" }).where(eq(users.id, existing.id));
  console.log(`Senha atualizada para ${normalized}.`);
} else {
  await db.insert(users).values({ email: normalized, passwordHash, name, role: "owner" });
  console.log(`Administrador ${normalized} criado.`);
}
await sql.end();

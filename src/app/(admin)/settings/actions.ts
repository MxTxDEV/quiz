"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import { setSetting } from "@/lib/services/settings";
import { changePassword, createUser, deleteUser, updateUserRole } from "@/lib/services/users";

export async function savePrivacyAction(value: unknown) {
  return run("settings.privacy", async () => {
    await assertUser("owner");
    await setSetting("privacy", value);
    revalidatePath("/settings");
  });
}

export async function createUserAction(input: { name: string; email: string; password: string; role: "owner" | "editor" | "viewer" }) {
  return run("settings.user.create", async () => {
    await assertUser("owner");
    await createUser(input);
    revalidatePath("/settings");
  });
}

export async function updateRoleAction(id: string, role: "owner" | "editor" | "viewer") {
  return run("settings.user.role", async () => {
    await assertUser("owner");
    await updateUserRole(z.string().uuid().parse(id), z.enum(["owner", "editor", "viewer"]).parse(role));
    revalidatePath("/settings");
  });
}

export async function deleteUserAction(id: string) {
  return run("settings.user.delete", async () => {
    const actor = await assertUser("owner");
    await deleteUser(z.string().uuid().parse(id), actor.id);
    revalidatePath("/settings");
  });
}

export async function changePasswordAction(current: string, next: string) {
  return run("settings.password", async () => {
    const user = await assertUser("viewer");
    await changePassword(user.id, current, next);
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import { deleteTemplate, installBuiltinTemplates } from "@/lib/services/templates";

export async function deleteTemplateAction(id: string) {
  return run("templates.delete", async () => {
    await assertUser("editor");
    await deleteTemplate(z.string().uuid().parse(id));
    revalidatePath("/templates");
  });
}

export async function installBuiltinsAction() {
  return run("templates.install", async () => {
    await assertUser("editor");
    const n = await installBuiltinTemplates();
    revalidatePath("/templates");
    return n;
  });
}

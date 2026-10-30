"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import { setSetting } from "@/lib/services/settings";
import { createWebhook, deleteWebhook, setWebhookActive } from "@/lib/services/integrations";

export async function saveGlobalTrackingAction(value: unknown) {
  return run("integrations.tracking", async () => {
    await assertUser("owner");
    await setSetting("tracking", value);
    revalidatePath("/integrations");
  });
}

export async function saveOutgoingWebhookAction(value: unknown) {
  return run("integrations.outgoing", async () => {
    await assertUser("owner");
    await setSetting("outgoingWebhook", value);
    revalidatePath("/integrations");
  });
}

export async function createWebhookAction(input: { provider: "generic" | "hotmart" | "kiwify"; name: string; campaignId: string | null; secret: string }) {
  return run("integrations.webhook.create", async () => {
    await assertUser("owner");
    const row = await createWebhook(input);
    revalidatePath("/integrations");
    return { id: row.id };
  });
}

export async function toggleWebhookAction(id: string, active: boolean) {
  return run("integrations.webhook.toggle", async () => {
    await assertUser("owner");
    await setWebhookActive(z.string().uuid().parse(id), active);
    revalidatePath("/integrations");
  });
}

export async function deleteWebhookAction(id: string) {
  return run("integrations.webhook.delete", async () => {
    await assertUser("owner");
    await deleteWebhook(z.string().uuid().parse(id));
    revalidatePath("/integrations");
  });
}

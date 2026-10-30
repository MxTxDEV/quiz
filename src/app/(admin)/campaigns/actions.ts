"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import {
  createCampaign,
  deleteCampaign,
  duplicateCampaign,
  publishCampaign,
  saveCampaignAsTemplate,
  saveCampaignSections,
  setCampaignStatus,
  updateCampaignMeta,
  type CreateCampaignInput,
} from "@/lib/services/campaigns";
import type { CampaignConfig } from "@/lib/domain/config";
import { addAdSpend, deleteAdSpend } from "@/lib/services/integrations";
import { recordManualPurchase } from "@/lib/services/purchases";

const uuid = z.string().uuid();

function touch(id?: string) {
  revalidatePath("/campaigns");
  if (id) revalidatePath(`/campaigns/${id}`, "layout");
}

export async function createCampaignAction(input: CreateCampaignInput) {
  return run("campaigns.create", async () => {
    await assertUser("editor");
    const row = await createCampaign(input);
    touch();
    return { id: row.id };
  });
}

export async function updateCampaignMetaAction(id: string, input: { name: string; description: string; slug: string; productId: string | null }) {
  return run("campaigns.meta", async () => {
    await assertUser("editor");
    await updateCampaignMeta(uuid.parse(id), input);
    touch(id);
  });
}

const sectionKeys = ["theme", "quiz", "profiles", "rules", "offer", "salesPage", "leadCapture", "tracking"] as const;

export async function saveSectionsAction(id: string, patch: Partial<CampaignConfig>) {
  return run("campaigns.sections", async () => {
    await assertUser("editor");
    for (const key of Object.keys(patch)) z.enum(sectionKeys).parse(key);
    const res = await saveCampaignSections(uuid.parse(id), patch);
    touch(id);
    return { updatedAt: res.updatedAt.toISOString() };
  });
}

export async function publishCampaignAction(id: string) {
  return run("campaigns.publish", async () => {
    await assertUser("editor");
    const res = await publishCampaign(uuid.parse(id));
    touch(id);
    return res;
  });
}

export async function setStatusAction(id: string, status: "draft" | "paused" | "archived") {
  return run("campaigns.status", async () => {
    await assertUser("editor");
    await setCampaignStatus(uuid.parse(id), z.enum(["draft", "paused", "archived"]).parse(status));
    touch(id);
  });
}

export async function duplicateCampaignAction(id: string) {
  return run("campaigns.duplicate", async () => {
    await assertUser("editor");
    const row = await duplicateCampaign(uuid.parse(id));
    touch();
    return { id: row.id };
  });
}

export async function deleteCampaignAction(id: string) {
  return run("campaigns.delete", async () => {
    await assertUser("owner");
    await deleteCampaign(uuid.parse(id));
    touch();
  });
}

export async function saveAsTemplateAction(id: string, input: { name: string; description?: string; category?: string }) {
  return run("campaigns.template", async () => {
    await assertUser("editor");
    await saveCampaignAsTemplate(uuid.parse(id), input);
    revalidatePath("/templates");
  });
}

export async function addAdSpendAction(input: { campaignId: string; date: string; amountCents: number; source: string; note?: string }) {
  return run("campaigns.adspend", async () => {
    await assertUser("editor");
    await addAdSpend(input);
    touch(input.campaignId);
  });
}

export async function deleteAdSpendAction(campaignId: string, id: string) {
  return run("campaigns.adspend.delete", async () => {
    await assertUser("editor");
    await deleteAdSpend(uuid.parse(id));
    touch(campaignId);
  });
}

export async function manualPurchaseAction(input: { campaignId: string; externalId: string; amountCents: number }) {
  return run("campaigns.manualPurchase", async () => {
    await assertUser("owner");
    const res = await recordManualPurchase(input);
    if (!res.created) throw new Error("Já existe uma venda manual com este identificador.");
    touch(input.campaignId);
  });
}

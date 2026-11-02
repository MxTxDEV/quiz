"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import { deleteReview, setReviewStatus } from "@/lib/services/reviews";

export async function setReviewStatusAction(id: string, status: "approved" | "rejected" | "pending") {
  return run("reviews.status", async () => {
    await assertUser("editor");
    const row = await setReviewStatus(z.string().uuid().parse(id), z.enum(["approved", "rejected", "pending"]).parse(status));
    if (row) revalidatePath(`/campaigns/${row.campaignId}/reviews`);
  });
}

export async function deleteReviewAction(id: string, campaignId: string) {
  return run("reviews.delete", async () => {
    await assertUser("owner");
    await deleteReview(z.string().uuid().parse(id));
    revalidatePath(`/campaigns/${z.string().uuid().parse(campaignId)}/reviews`);
  });
}

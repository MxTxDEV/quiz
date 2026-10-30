"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { run } from "@/lib/actions/result";
import { eraseByEmail, eraseLead } from "@/lib/services/leads";

export async function eraseLeadAction(id: string) {
  return run("leads.erase", async () => {
    await assertUser("owner");
    await eraseLead(z.string().uuid().parse(id));
    revalidatePath("/leads");
  });
}

export async function eraseByEmailAction(email: string) {
  return run("leads.eraseEmail", async () => {
    await assertUser("owner");
    const n = await eraseByEmail(z.string().email("E-mail inválido").parse(email));
    revalidatePath("/leads");
    return n;
  });
}

import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getCampaign } from "@/lib/services/campaigns";

/** Carrega a campanha uma vez por requisição (layout + página). */
export const loadCampaign = cache(async (id: string) => {
  if (!z.string().uuid().safeParse(id).success) notFound();
  const c = await getCampaign(id);
  if (!c) notFound();
  return c;
});

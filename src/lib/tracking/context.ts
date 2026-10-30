export type Device = "mobile" | "tablet" | "desktop";

export function detectDevice(ua: string | null | undefined): Device {
  const s = (ua ?? "").toLowerCase();
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/.test(s)) return "tablet";
  if (/mobi|iphone|ipod|android|blackberry|opera mini|iemobile/.test(s)) return "mobile";
  return "desktop";
}

export type Utm = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);

export function pickUtm(input: Record<string, unknown>): Utm {
  return {
    utmSource: clean(input.utm_source),
    utmMedium: clean(input.utm_medium),
    utmCampaign: clean(input.utm_campaign),
    utmContent: clean(input.utm_content),
    utmTerm: clean(input.utm_term),
  };
}

/** Origem de tráfego: UTM source > parâmetros de clique > referrer > direto. */
export function classifySource(utm: Utm, referrer: string | null, params: Record<string, unknown> = {}): string {
  if (utm.utmSource) return utm.utmSource.toLowerCase();
  if (params.fbclid) return "facebook";
  if (params.gclid) return "google";
  if (params.ttclid) return "tiktok";
  if (!referrer) return "direct";
  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");
    if (/facebook|fb\.|instagram/.test(host)) return host.includes("instagram") ? "instagram" : "facebook";
    if (/google\./.test(host)) return "google";
    if (/youtube|youtu\.be/.test(host)) return "youtube";
    if (/tiktok/.test(host)) return "tiktok";
    if (/t\.co|twitter|x\.com/.test(host)) return "twitter";
    return host;
  } catch {
    return "direct";
  }
}

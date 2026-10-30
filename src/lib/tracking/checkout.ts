/**
 * Monta a URL final de checkout repassando a sessão (para atribuição via webhook) e as UTMs.
 * `sck`/`src` são os parâmetros de rastreamento aceitos por Hotmart/Kiwify;
 * `fos_sid` é o parâmetro próprio do FunnelOS para o webhook genérico.
 */
export function buildCheckoutUrl(
  base: string,
  sessionId: string,
  utm: Partial<Record<"utm_source" | "utm_medium" | "utm_campaign" | "utm_content" | "utm_term", string | null>>,
): string | null {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  url.searchParams.set("fos_sid", sessionId);
  if (!url.searchParams.has("sck")) url.searchParams.set("sck", sessionId);
  if (!url.searchParams.has("src")) url.searchParams.set("src", sessionId);
  for (const [k, v] of Object.entries(utm)) if (v && !url.searchParams.has(k)) url.searchParams.set(k, v);
  return url.toString();
}

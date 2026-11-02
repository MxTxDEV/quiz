/**
 * Regras para campos de imagem (capa do produto, bônus, logo, imagens de blocos).
 * Um erro comum é colar no campo de imagem o link do checkout ou de uma página: o navegador mostra
 * uma imagem quebrada. Esses links são ignorados na página pública e bloqueiam a publicação.
 */
const PAGE_HOSTS = [
  /^(pay|checkout|go)\./i, // pay.kiwify.com.br, pay.hotmart.com, go.hotmart.com, checkout.* …
  /(^|\.)mpago\.la$/i,
  /(^|\.)wa\.me$/i,
  /(^|\.)instagram\.com$/i,
  /(^|\.)facebook\.com$/i,
  /(^|\.)drive\.google\.com$/i,
  /(^|\.)docs\.google\.com$/i,
];
const IMAGE_HOST_EXCEPTIONS = [/(^|\.)fbcdn\.net$/i, /(^|\.)cdninstagram\.com$/i, /(^|\.)googleusercontent\.com$/i];

/** Por que este link não serve como imagem (ou null se parece uma imagem válida). */
export function imageUrlProblem(url: string | undefined | null, checkoutUrl?: string): string | null {
  const v = (url ?? "").trim();
  if (!v) return null;
  if (v.startsWith("/") && !v.startsWith("//")) return null; // arquivo do próprio site
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return "não é um endereço válido";
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return "precisa começar com https://";
  if (checkoutUrl && sameLink(v, checkoutUrl)) return "é o link do checkout, não de uma imagem";
  if (IMAGE_HOST_EXCEPTIONS.some((r) => r.test(u.hostname))) return null;
  if (PAGE_HOSTS.some((r) => r.test(u.hostname))) return "é o link de uma página (checkout, rede social ou Drive), não de uma imagem";
  return null;
}

/** Devolve a URL só se ela puder ser usada como imagem; senão, string vazia (a página usa a capa gerada). */
export function usableImageUrl(url: string | undefined | null, checkoutUrl?: string): string {
  const v = (url ?? "").trim();
  return v && !imageUrlProblem(v, checkoutUrl) ? v : "";
}

function sameLink(a: string, b: string) {
  const norm = (s: string) => s.trim().replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
  return norm(a) === norm(b);
}

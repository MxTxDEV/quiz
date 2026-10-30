import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PREFIXES = [
  "/dashboard",
  "/campaigns",
  "/products",
  "/quiz-builder",
  "/sales-pages",
  "/templates",
  "/analytics",
  "/integrations",
  "/settings",
  "/leads",
  "/preview",
];

/** Verificação otimista: sem cookie de sessão → login. A validação real ocorre no servidor. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (!request.cookies.has("fos_session")) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|q/|_next/static|_next/image|favicon.ico).*)"],
};

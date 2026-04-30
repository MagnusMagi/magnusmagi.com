import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";
import { prefersMarkdown } from "./lib/accept";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "./lib/admin-auth";

const intlMiddleware = createMiddleware(routing);

function requiresAdmin(pathname: string): boolean {
  return (
    pathname === "/keystatic" ||
    pathname.startsWith("/keystatic/") ||
    pathname.startsWith("/api/keystatic/")
  );
}

function isMarkdownEligible(pathname: string): boolean {
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return false;
  if (pathname === "/login") return false;
  if (pathname === "/keystatic" || pathname.startsWith("/keystatic/")) return false;
  return true;
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (requiresAdmin(pathname)) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = verifySessionToken(token);
    if (!session) {
      if (pathname.startsWith("/api/")) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    isMarkdownEligible(pathname) &&
    prefersMarkdown(request.headers.get("accept"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/api/markdown";
    return NextResponse.rewrite(url, {
      request: {
        headers: new Headers({
          ...Object.fromEntries(request.headers),
          "x-markdown-path": pathname,
        }),
      },
    });
  }

  if (pathname === "/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};

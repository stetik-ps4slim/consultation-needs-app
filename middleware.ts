import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protected dashboard middleware.
 *
 * Public (no auth needed):
 *   - /intake          — client-facing consultation form
 *   - /login           — login page itself
 *   - /api/auth        — logout API
 *   - POST /api/consultation-needs — intake form submission from clients
 *
 * Everything else requires the sb-token cookie (Supabase JWT).
 */

const PUBLIC_PAGE_PREFIXES = ["/intake", "/login", "/api/auth", "/_next", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/" || PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow the public intake form POST (clients submitting their form)
  if (pathname === "/api/consultation-needs" && request.method === "POST") {
    return NextResponse.next();
  }

  const token = request.cookies.get("sb-token")?.value;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"]
};

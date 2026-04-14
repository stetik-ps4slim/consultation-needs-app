import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Protected dashboard middleware.
 *
 * Public (no password needed):
 *   - /intake          — client-facing consultation form
 *   - /login           — login page itself
 *   - /api/auth        — login / logout API
 *   - POST /api/consultation-needs — intake form submission from clients
 *
 * Everything else requires the DASHBOARD_PASSWORD cookie to be set.
 * If DASHBOARD_PASSWORD env var is not configured, auth is skipped
 * so the app keeps working without extra setup.
 */

const PUBLIC_PAGE_PREFIXES = ["/intake", "/login", "/api/auth", "/_next", "/favicon"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public pages and Next.js internals
  if (PUBLIC_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // Allow the public intake form POST (clients submitting their form)
  if (pathname === "/api/consultation-needs" && request.method === "POST") {
    return NextResponse.next();
  }

  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  // If no password is configured, skip auth (backward-compatible for dev)
  if (!expectedPassword) {
    return NextResponse.next();
  }

  const authToken = request.cookies.get("auth_token")?.value;

  if (authToken !== expectedPassword) {
    // API routes → 401 JSON
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Pages → redirect to login
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("redirect", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"]
};

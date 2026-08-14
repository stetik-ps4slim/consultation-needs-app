import { NextResponse } from "next/server";

/**
 * DELETE /api/auth — logout (clear sb-token cookie)
 * Login is handled client-side via Supabase Auth directly.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("sb-token", "", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
  return response;
}

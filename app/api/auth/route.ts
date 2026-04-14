import { NextResponse } from "next/server";

/**
 * POST /api/auth  — login with DASHBOARD_PASSWORD
 * DELETE /api/auth — logout (clear auth cookie)
 */

export async function POST(request: Request) {
  const expectedPassword = process.env.DASHBOARD_PASSWORD;

  if (!expectedPassword) {
    // No password configured — auth is disabled, nothing to verify
    return NextResponse.json(
      { error: "Password protection is not configured on this deployment." },
      { status: 503 }
    );
  }

  let password: string | undefined;
  try {
    const body = (await request.json()) as { password?: string };
    password = body.password;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!password || password !== expectedPassword) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", expectedPassword, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/"
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/"
  });
  return response;
}

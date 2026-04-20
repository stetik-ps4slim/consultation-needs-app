import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/revenue?gcal=error", url.origin));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/revenue?gcal=error", url.origin));
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokens = (await tokenRes.json()) as GoogleTokenResponse;

    console.log("Google token response:", JSON.stringify({ ok: tokenRes.ok, hasAccess: !!tokens.access_token, hasRefresh: !!tokens.refresh_token, error: tokens.error }));

    if (!tokenRes.ok || !tokens.access_token) {
      return NextResponse.redirect(new URL(`/revenue?gcal=error&reason=${encodeURIComponent(tokens.error ?? "no_access_token")}`, url.origin));
    }

    const supabase = createSupabaseAdminClient();

    // If no refresh_token returned (already granted before), keep the existing one
    const existing = await supabase.from("google_tokens").select("refresh_token").eq("id", "singleton").maybeSingle();
    const refreshToken = tokens.refresh_token ?? existing.data?.refresh_token ?? "";

    if (!refreshToken) {
      // Force re-consent by redirecting back to auth with prompt=consent
      return NextResponse.redirect(new URL("/api/google-calendar/auth", url.origin));
    }

    await supabase.from("google_tokens").upsert({
      id: "singleton",
      access_token: tokens.access_token,
      refresh_token: refreshToken,
      expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
      event_ids: [],
      updated_at: new Date().toISOString(),
    });

    return NextResponse.redirect(new URL("/revenue?gcal=connected", url.origin));
  } catch {
    return NextResponse.redirect(new URL("/revenue?gcal=error", url.origin));
  }
}

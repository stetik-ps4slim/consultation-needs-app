"use client";

import { useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${days * 86400}; SameSite=Lax${secure}`;
}

/**
 * Silently refreshes the Supabase access token using the stored refresh token.
 * Runs once on mount for every page in the app.
 */
export function SessionRefresher() {
  useEffect(() => {
    const accessToken = getCookie("sb-token");
    const refreshToken = getCookie("sb-refresh-token");

    if (!refreshToken) return;

    const supabase = createBrowserSupabaseClient();

    supabase.auth
      .setSession({ access_token: accessToken ?? "", refresh_token: refreshToken })
      .then(({ data }) => {
        if (data.session) {
          setCookie("sb-token", data.session.access_token, 7);
          setCookie("sb-refresh-token", data.session.refresh_token, 30);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}

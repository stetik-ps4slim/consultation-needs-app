import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseConfig } from "@/lib/consultation-needs";

export async function GET() {
  if (!hasSupabaseConfig() || !process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.json({ connected: false, configured: false });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("google_tokens")
      .select("id")
      .eq("id", "singleton")
      .maybeSingle();

    return NextResponse.json({ connected: Boolean(data), configured: true });
  } catch {
    return NextResponse.json({ connected: false, configured: true });
  }
}

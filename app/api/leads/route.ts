import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseConfig, normalizeLeadInsert, type LeadPayload } from "@/lib/leads";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent leads yet." },
      { status: 503 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ leads: data ?? [] });
  } catch (error) {
    console.error("Lead fetch failed", error);

    return NextResponse.json(
      { error: "Something went wrong while loading leads." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent leads yet." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as LeadPayload;
    const payload = normalizeLeadInsert(body);

    if (!payload.name || !payload.phone || !payload.email || !payload.goal) {
      return NextResponse.json(
        { error: "Please complete every field before submitting." },
        { status: 400 }
      );
    }

    if (!emailPattern.test(payload.email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .insert({
        ...payload,
        status: "new",
        follow_up_calls: payload.follow_up_calls,
        consultation_sessions_completed: payload.consultation_sessions_completed,
        last_contacted_at: null
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert failed", error);

      return NextResponse.json(
        { error: "We could not save your details right now. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Lead saved successfully.",
      lead: data
    });
  } catch (error) {
    console.error("Lead submission failed", error);

    return NextResponse.json(
      { error: "Something went wrong while sending your request." },
      { status: 500 }
    );
  }
}

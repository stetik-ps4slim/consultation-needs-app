import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  buildConsultationNeedsInsert,
  hasSupabaseConfig,
  type ConsultationNeedsForm
} from "@/lib/consultation-needs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for consultation form storage yet." },
      { status: 503 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("consultation_needs")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ records: data ?? [] });
  } catch (error) {
    console.error("Consultation needs fetch failed", error);

    return NextResponse.json(
      { error: "Something went wrong while loading consultation forms." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for consultation form storage yet." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<ConsultationNeedsForm>;
    const payload = buildConsultationNeedsInsert(body);

    if (!payload.client_name || !payload.client_phone || !payload.goal) {
      return NextResponse.json(
        { error: "Client name, phone number, and goal are required before saving online." },
        { status: 400 }
      );
    }

    if (payload.client_email && !emailPattern.test(payload.client_email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address before saving online." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("consultation_needs")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: "Consultation form saved successfully.",
      record: data
    });
  } catch (error) {
    console.error("Consultation needs create failed", error);

    return NextResponse.json(
      { error: "Something went wrong while saving the consultation form." },
      { status: 500 }
    );
  }
}

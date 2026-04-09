import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  buildConsultationNeedsInsert,
  hasSupabaseConfig,
  type ConsultationNeedsForm
} from "@/lib/consultation-needs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for consultation form storage yet." },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const recordId = Number(id);

    if (!Number.isInteger(recordId)) {
      return NextResponse.json({ error: "Invalid consultation form id." }, { status: 400 });
    }

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
      .update(payload)
      .eq("id", recordId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: "Consultation form updated successfully.",
      record: data
    });
  } catch (error) {
    console.error("Consultation needs update failed", error);

    return NextResponse.json(
      { error: "Something went wrong while updating the consultation form." },
      { status: 500 }
    );
  }
}

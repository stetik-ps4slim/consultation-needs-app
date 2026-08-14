import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getUserIdFromRequest } from "@/lib/supabase";
import {
  buildConsultationNeedsInsert,
  hasSupabaseConfig,
  type ConsultationNeedsForm
} from "@/lib/consultation-needs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for consultation form storage yet." },
      { status: 503 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("consultation_needs")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("updated_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ records: data ?? [] });
  } catch {
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

  // user_id is optional — public intake form submissions have no user context
  const userId = await getUserIdFromRequest(request);

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
      .insert({ ...payload, ...(userId ? { user_id: userId } : {}) })
      .select()
      .single();

    if (error) throw error;

    // Auto-create lead from intake form
    try {
      const orFilters: string[] = [];
      if (payload.client_phone) orFilters.push(`phone.eq.${payload.client_phone}`);
      if (payload.client_email) orFilters.push(`email.eq.${payload.client_email}`);

      let alreadyExists = false;
      if (orFilters.length > 0) {
        const { data: existing } = await supabase
          .from("leads")
          .select("id")
          .or(orFilters.join(","))
          .limit(1);
        alreadyExists = (existing?.length ?? 0) > 0;
      }

      if (!alreadyExists) {
        await supabase.from("leads").insert({
          name: payload.client_name,
          phone: payload.client_phone ?? "",
          email: payload.client_email ?? "",
          goal: payload.goal ?? "",
          source: "intake-form",
          service_interest: "1:1 PT",
          status: "new",
          notes: `Auto-added from intake form submission.`,
          follow_up_calls: 0,
          consultation_sessions_completed: 0,
          last_contacted_at: null,
          ...(userId ? { user_id: userId } : {})
        });
      }
    } catch {
      // Lead creation is best-effort
    }

    return NextResponse.json({
      message: "Consultation form saved successfully.",
      record: data
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while saving the consultation form." },
      { status: 500 }
    );
  }
}

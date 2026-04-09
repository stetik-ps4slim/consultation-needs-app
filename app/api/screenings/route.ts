import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  hasSupabaseConfig,
  normalizeClientInsert,
  type ScreeningClientInsert
} from "@/lib/movement-screening";

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent screenings yet." },
      { status: 503 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("movement_screenings")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    const clients = (data ?? []).map((record) => ({
      id: record.id,
      name: record.name,
      injury: record.injury,
      screeningDate: record.screening_date,
      contact: record.contact,
      health: record.health,
      conductedBy: record.conducted_by,
      warmupNotes: record.warmup_notes,
      overallNotes: record.overall_notes,
      sections: record.sections,
      updatedAt: record.updated_at,
      createdAt: record.created_at
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Screening fetch failed", error);

    return NextResponse.json(
      { error: "Something went wrong while loading client screenings." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent screenings yet." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<ScreeningClientInsert>;
    const payload = normalizeClientInsert(body);

    if (!payload.name) {
      return NextResponse.json(
        { error: "Client name is required before saving." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("movement_screenings")
      .insert({
        name: payload.name,
        injury: payload.injury,
        screening_date: payload.screeningDate || null,
        contact: payload.contact,
        health: payload.health,
        conducted_by: payload.conductedBy,
        warmup_notes: payload.warmupNotes,
        overall_notes: payload.overallNotes,
        sections: payload.sections
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      client: {
        id: data.id,
        name: data.name,
        injury: data.injury,
        screeningDate: data.screening_date,
        contact: data.contact,
        health: data.health,
        conductedBy: data.conducted_by,
        warmupNotes: data.warmup_notes,
        overallNotes: data.overall_notes,
        sections: data.sections,
        updatedAt: data.updated_at,
        createdAt: data.created_at
      }
    });
  } catch (error) {
    console.error("Screening create failed", error);

    return NextResponse.json(
      { error: "Something went wrong while saving the client screening." },
      { status: 500 }
    );
  }
}

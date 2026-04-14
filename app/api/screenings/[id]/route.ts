import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  hasSupabaseConfig,
  normalizeClientUpdate
} from "@/lib/movement-screening";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent screenings yet." },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const clientId = Number(id);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }

    const updates = normalizeClientUpdate((await request.json()) as Record<string, unknown>);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("movement_screenings")
      .update({
        ...(updates.name !== undefined ? { name: updates.name } : {}),
        ...(updates.injury !== undefined ? { injury: updates.injury } : {}),
        ...(updates.screeningDate !== undefined
          ? { screening_date: updates.screeningDate || null }
          : {}),
        ...(updates.contact !== undefined ? { contact: updates.contact } : {}),
        ...(updates.health !== undefined ? { health: updates.health } : {}),
        ...(updates.conductedBy !== undefined ? { conducted_by: updates.conductedBy } : {}),
        ...(updates.warmupNotes !== undefined ? { warmup_notes: updates.warmupNotes } : {}),
        ...(updates.overallNotes !== undefined ? { overall_notes: updates.overallNotes } : {}),
        ...(updates.sections !== undefined ? { sections: updates.sections } : {})
      })
      .eq("id", clientId)
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
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the client screening." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent screenings yet." },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const clientId = Number(id);

    if (!Number.isInteger(clientId) || clientId <= 0) {
      return NextResponse.json({ error: "Invalid client id." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("movement_screenings")
      .delete()
      .eq("id", clientId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the client screening." },
      { status: 500 }
    );
  }
}

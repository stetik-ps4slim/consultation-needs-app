import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseConfig, normalizeLeadUpdate } from "@/lib/leads";

function parseLeadId(id: string) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for persistent leads yet." },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const leadId = parseLeadId(id);

    if (!leadId) {
      return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });
    }

    const updates = normalizeLeadUpdate((await request.json()) as Record<string, unknown>);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .update(updates)
      .eq("id", leadId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ lead: data });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the lead." },
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
      { error: "Supabase is not configured for persistent leads yet." },
      { status: 503 }
    );
  }

  try {
    const { id } = await context.params;
    const leadId = parseLeadId(id);

    if (!leadId) {
      return NextResponse.json({ error: "Invalid lead id." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("leads")
      .delete()
      .eq("id", leadId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the lead." },
      { status: 500 }
    );
  }
}

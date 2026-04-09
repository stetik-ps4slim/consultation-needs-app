import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseConfig, normalizeLeadUpdate } from "@/lib/leads";

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
    const leadId = Number(id);

    if (!Number.isInteger(leadId)) {
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
  } catch (error) {
    console.error("Lead update failed", error);

    return NextResponse.json(
      { error: "Something went wrong while updating the lead." },
      { status: 500 }
    );
  }
}

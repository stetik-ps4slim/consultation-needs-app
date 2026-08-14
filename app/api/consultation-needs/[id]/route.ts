import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getUserIdFromRequest } from "@/lib/supabase";
import { hasSupabaseConfig } from "@/lib/consultation-needs";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for consultation form storage yet." },
      { status: 503 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const recordId = Number(id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return NextResponse.json({ error: "Invalid consultation form id." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("consultation_needs")
      .delete()
      .eq("id", recordId)
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (error) throw error;

    return NextResponse.json({ message: "Consultation form deleted successfully." });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the consultation form." },
      { status: 500 }
    );
  }
}

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

  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const recordId = Number(id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return NextResponse.json({ error: "Invalid consultation form id." }, { status: 400 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const partialUpdate: Record<string, unknown> = {};
    if (body.client_name !== undefined) partialUpdate.client_name = String(body.client_name).trim();
    if (body.client_phone !== undefined) partialUpdate.client_phone = String(body.client_phone).trim();
    if (body.client_email !== undefined) partialUpdate.client_email = String(body.client_email).trim().toLowerCase();
    if (body.goal !== undefined) partialUpdate.goal = String(body.goal).trim();

    if (Object.keys(partialUpdate).length === 0) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("consultation_needs")
      .update(partialUpdate)
      .eq("id", recordId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: "Consultation form updated successfully.", record: data });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the consultation form." },
      { status: 500 }
    );
  }
}

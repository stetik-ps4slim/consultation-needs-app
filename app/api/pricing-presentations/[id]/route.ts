import { NextResponse } from "next/server";
import { createSupabaseAdminClient, getUserIdFromRequest } from "@/lib/supabase";
import { hasSupabaseConfig, normalizePricingPresentationUpdate } from "@/lib/pricing-presentations";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const recordId = Number(id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return NextResponse.json({ error: "Invalid pricing presentation id." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("pricing_presentations")
      .delete()
      .eq("id", recordId)
      .or(`user_id.eq.${userId},user_id.is.null`);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while deleting the pricing presentation." },
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
      { error: "Supabase is not configured for pricing presentation storage yet." },
      { status: 503 }
    );
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const recordId = Number(id);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return NextResponse.json({ error: "Invalid pricing presentation id." }, { status: 400 });
    }

    const updates = normalizePricingPresentationUpdate((await request.json()) as Record<string, unknown>);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("pricing_presentations")
      .update(updates)
      .eq("id", recordId)
      .or(`user_id.eq.${userId},user_id.is.null`)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ pricingPresentation: data });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while updating the pricing presentation." },
      { status: 500 }
    );
  }
}

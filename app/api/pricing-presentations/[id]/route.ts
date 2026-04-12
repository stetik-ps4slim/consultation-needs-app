import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseConfig, normalizePricingPresentationUpdate } from "@/lib/pricing-presentations";

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

  try {
    const { id } = await context.params;
    const recordId = Number(id);

    if (!Number.isInteger(recordId)) {
      return NextResponse.json({ error: "Invalid pricing presentation id." }, { status: 400 });
    }

    const updates = normalizePricingPresentationUpdate((await request.json()) as Record<string, unknown>);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("pricing_presentations")
      .update(updates)
      .eq("id", recordId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ pricingPresentation: data });
  } catch (error) {
    console.error("Pricing presentation update failed", error);

    return NextResponse.json(
      { error: "Something went wrong while updating the pricing presentation." },
      { status: 500 }
    );
  }
}

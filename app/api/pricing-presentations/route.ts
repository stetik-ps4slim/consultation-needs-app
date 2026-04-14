import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";
import {
  buildPricingPresentationInsert,
  hasSupabaseConfig,
  type PricingPresentationForm
} from "@/lib/pricing-presentations";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for pricing presentation storage yet." },
      { status: 503 }
    );
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("pricing_presentations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ pricingPresentations: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while loading pricing presentations." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!hasSupabaseConfig()) {
    return NextResponse.json(
      { error: "Supabase is not configured for pricing presentation storage yet." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as Partial<PricingPresentationForm>;
    const payload = buildPricingPresentationInsert(body);

    if (!payload.client_name || !payload.goal || !payload.selected_package_name) {
      return NextResponse.json(
        { error: "Client name, goal, and selected package are required before saving online." },
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
      .from("pricing_presentations")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      message: "Pricing presentation saved successfully.",
      pricingPresentation: data
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while saving the pricing presentation." },
      { status: 500 }
    );
  }
}

import type { Metadata } from "next";
import { MovementScreeningDashboard } from "@/components/movement-screening-dashboard";
import {
  hasSupabaseConfig,
  sampleClients,
  type ScreeningClient
} from "@/lib/movement-screening";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Movement Screening | The Upper Notch",
  description: "Record and review movement screening assessments for clients."
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getClients(): Promise<{ clients: ScreeningClient[]; isPersistent: boolean }> {
  if (!hasSupabaseConfig()) {
    return { clients: sampleClients, isPersistent: false };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("movement_screenings")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const clients: ScreeningClient[] = (data ?? []).map((record) => ({
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

    return { clients: clients.length ? clients : sampleClients, isPersistent: true };
  } catch {
    return { clients: sampleClients, isPersistent: false };
  }
}

export default async function ScreeningPage() {
  const { clients, isPersistent } = await getClients();
  return <MovementScreeningDashboard initialClients={clients} isPersistent={isPersistent} />;
}

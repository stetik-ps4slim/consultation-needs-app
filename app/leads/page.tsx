import type { Metadata } from "next";
import { LeadTrackerDashboard } from "@/components/lead-tracker-dashboard";
import { hasSupabaseConfig, sampleLeads, type Lead } from "@/lib/leads";
import { createSupabaseAdminClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Lead Tracker | The Upper Notch",
  description: "Track every enquiry from first message to signed client."
};

async function getLeads(): Promise<{ leads: Lead[]; isFallback: boolean }> {
  if (!hasSupabaseConfig()) {
    return { leads: sampleLeads, isFallback: true };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { leads: data ?? [], isFallback: false };
  } catch {
    return { leads: sampleLeads, isFallback: true };
  }
}

export default async function LeadsPage() {
  const { leads, isFallback } = await getLeads();
  return <LeadTrackerDashboard initialLeads={leads} isFallback={isFallback} />;
}

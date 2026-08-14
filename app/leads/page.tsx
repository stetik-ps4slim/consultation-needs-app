import type { Metadata } from "next";
import { LeadTrackerDashboard } from "@/components/lead-tracker-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Tracker | The Upper Notch",
  description: "Track every enquiry from first message to signed client."
};

export default function LeadsPage() {
  return <LeadTrackerDashboard initialLeads={[]} isFallback={false} />;
}

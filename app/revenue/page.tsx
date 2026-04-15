import type { Metadata } from "next";
import { RevenueTrackerDashboard } from "@/components/revenue-tracker-dashboard";

export const metadata: Metadata = {
  title: "Revenue Tracker | The Upper Notch",
  description: "Daily scorecard, call scripts, revenue goals and fastest path to target."
};

export default function RevenuePage() {
  return <RevenueTrackerDashboard />;
}

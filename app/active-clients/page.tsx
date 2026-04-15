import type { Metadata } from "next";
import { ActiveClientsDashboard } from "@/components/active-clients-dashboard";

export const metadata: Metadata = {
  title: "Active Clients | The Upper Notch",
  description: "Track active clients, packages, weekly revenue, and lost clients."
};

export default function ActiveClientsPage() {
  return <ActiveClientsDashboard />;
}

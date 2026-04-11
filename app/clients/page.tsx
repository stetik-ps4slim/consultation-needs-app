import type { Metadata } from "next";
import { ConsultationRecordsDashboard } from "@/components/consultation-records-dashboard";

export const metadata: Metadata = {
  title: "Client Records | Consultation Needs App",
  description: "Search and view saved consultation needs analysis records."
};

export default function ClientsPage() {
  return <ConsultationRecordsDashboard />;
}

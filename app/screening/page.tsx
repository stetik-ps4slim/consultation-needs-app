import type { Metadata } from "next";
import { MovementScreeningDashboard } from "@/components/movement-screening-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Movement Screening | The Upper Notch",
  description: "Record and review movement screening assessments for clients."
};

export default function ScreeningPage() {
  return <MovementScreeningDashboard initialClients={[]} isPersistent={true} />;
}

import type { Metadata } from "next";
import { ClientIntakeForm } from "@/components/client-intake-form";

export const metadata: Metadata = {
  title: "Consultation Intake Form | The Upper Notch",
  description: "Complete your pre-consultation form for The Upper Notch."
};

export default function IntakePage() {
  return <ClientIntakeForm />;
}

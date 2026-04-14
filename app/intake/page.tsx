import type { Metadata } from "next";
import { ClientIntakeForm } from "@/components/client-intake-form";

export const metadata: Metadata = {
  title: "Consultation Intake Form | JS PT",
  description: "Complete your pre-consultation form for Jazzay Sallah Personal Training."
};

export default function IntakePage() {
  return <ClientIntakeForm />;
}

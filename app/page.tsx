import type { Metadata } from "next";
import { ConsultationIntakeApp } from "@/components/consultation-intake-app";

export const metadata: Metadata = {
  title: "New Consultation | The Upper Notch",
  description:
    "Start a new client consultation — capture goals, training background, scheduling, and pre-exercise screening."
};

export default function HomePage() {
  return <ConsultationIntakeApp />;
}

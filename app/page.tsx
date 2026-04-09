import type { Metadata } from "next";
import { ConsultationIntakeApp } from "@/components/consultation-intake-app";

export const metadata: Metadata = {
  title: "Consultation Needs Analysis App",
  description:
    "A consultation intake app for collecting client goals, planning details, training background, and pre-exercise screening."
};

export default function HomePage() {
  return <ConsultationIntakeApp />;
}

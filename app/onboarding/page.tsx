import type { Metadata } from "next";
import { OnboardingDashboard } from "@/components/onboarding-dashboard";

export const metadata: Metadata = {
  title: "Onboarding Pipeline | The Upper Notch",
  description: "A connected coach dashboard for leads, consultation records, movement screenings, and onboarding next steps."
};

export default function OnboardingPage() {
  return <OnboardingDashboard />;
}

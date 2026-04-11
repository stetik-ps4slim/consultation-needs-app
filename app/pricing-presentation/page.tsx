import type { Metadata } from "next";
import { PricingPresentationApp } from "@/components/pricing-presentation-app";

export const metadata: Metadata = {
  title: "Price Presentation | Upper Notch Coaching",
  description: "Editable in-person pricing presentation for Upper Notch Coaching packages and nutrition add-ons."
};

export default function PricingPresentationPage() {
  return <PricingPresentationApp />;
}

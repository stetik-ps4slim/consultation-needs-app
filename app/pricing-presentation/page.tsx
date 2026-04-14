import type { Metadata } from "next";
import { PricingPresentationApp } from "@/components/pricing-presentation-app";

export const metadata: Metadata = {
  title: "Price Presentation | The Upper Notch",
  description: "Editable in-person pricing presentation for The Upper Notch packages and nutrition add-ons."
};

export default function PricingPresentationPage() {
  return <PricingPresentationApp />;
}

import type { Metadata } from "next";
import { OnlineCoachingApp } from "@/components/online-coaching-app";

export const metadata: Metadata = {
  title: "Online Coaching | The Upper Notch",
  description: "Online coaching packages — Upper Notch Coaching."
};

export default function OnlineCoachingPage() {
  return <OnlineCoachingApp />;
}

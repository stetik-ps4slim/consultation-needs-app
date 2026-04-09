import { AboutSection } from "@/components/sections/about-section";
import { BookingSection } from "@/components/sections/booking-section";
import { CtaBanner } from "@/components/sections/cta-banner";
import { FaqSection } from "@/components/sections/faq-section";
import { HeroSection } from "@/components/sections/hero-section";
import { LeadFormSection } from "@/components/sections/lead-form-section";
import { ResultsSection } from "@/components/sections/results-section";
import { ServicesSection } from "@/components/sections/services-section";

export default function LandingPage() {
  return (
    <main className="overflow-x-hidden">
      <HeroSection />
      <AboutSection />
      <ServicesSection />
      <ResultsSection />
      <FaqSection />
      <LeadFormSection />
      <BookingSection />
      <CtaBanner />
    </main>
  );
}

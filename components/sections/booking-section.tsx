import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

export function BookingSection() {
  return (
    <section className="section-space">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <SectionHeading
          eyebrow="Book Online"
          title={siteContent.booking.title}
          description={siteContent.booking.description}
        />

        <div className="panel overflow-hidden border-accent/25 shadow-glow">
          <iframe
            title="Book a consultation with Upper Notch Coaching"
            src={`${siteContent.brand.consultationLink}?hide_gdpr_banner=1&primary_color=d2a86c`}
            className="h-[720px] w-full bg-black"
          />
        </div>
      </div>
    </section>
  );
}

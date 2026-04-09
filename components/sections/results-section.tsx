import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

export function ResultsSection() {
  return (
    <section className="section-space">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Results"
          title={siteContent.testimonials.title}
          description={siteContent.testimonials.description}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {siteContent.testimonials.items.map((testimonial) => (
            <article key={testimonial.name} className="panel p-6 sm:p-8">
              <p className="text-lg leading-8 text-zinc-100">“{testimonial.quote}”</p>
              <div className="mt-8 border-t border-white/10 pt-5">
                <p className="text-xl uppercase text-ink">{testimonial.name}</p>
                <p className="mt-1 text-sm uppercase tracking-[0.18em] text-accent">
                  {testimonial.result}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

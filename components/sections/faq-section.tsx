import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

export function FaqSection() {
  return (
    <section className="section-space">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          eyebrow="FAQ"
          title={siteContent.faq.title}
          description={siteContent.faq.description}
        />

        <div className="space-y-4">
          {siteContent.faq.items.map((faq) => (
            <div key={faq.question} className="panel p-6">
              <h3 className="text-2xl uppercase text-ink">{faq.question}</h3>
              <p className="mt-3 text-base leading-7 text-zinc-300">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

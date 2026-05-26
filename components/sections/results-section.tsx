import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

export function ResultsSection() {
  return (
    <section className="section-space">
      <div className="container-shell">
        <SectionHeading
          eyebrow="The Approach"
          title={siteContent.approach.title}
          description={siteContent.approach.description}
        />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {siteContent.approach.items.map((item, index) => (
            <article key={item.title} className="panel p-6 sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 text-3xl uppercase leading-none text-ink">
                {item.title}
              </h3>
              <p className="mt-5 text-base leading-7 text-zinc-300">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

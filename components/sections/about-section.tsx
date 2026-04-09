import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

export function AboutSection() {
  return (
    <section className="section-space">
      <div className="container-shell grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <div className="panel p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">The Coach</p>
          <div className="mt-6">
            <p className="text-5xl uppercase leading-none text-ink sm:text-6xl">
              {siteContent.about.coachName}
            </p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-400">
              {siteContent.about.coachRole}
            </p>
            <p className="mt-4 text-base leading-7 text-zinc-300">
              {siteContent.about.coachCardText}
            </p>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-accent">
              {siteContent.brand.location}
            </p>
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="About"
            title={siteContent.about.title}
            description={siteContent.about.description}
          />
          <div className="mt-8 grid gap-4 text-base leading-7 text-zinc-300 sm:grid-cols-2">
            {siteContent.about.points.map((point) => (
              <div key={point} className="panel p-5">
                {point}
              </div>
            ))}
          </div>
          <p className="mt-6 text-lg font-semibold text-accent">{siteContent.about.closing}</p>
        </div>
      </div>
    </section>
  );
}

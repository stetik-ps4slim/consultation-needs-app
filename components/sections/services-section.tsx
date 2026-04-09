import { SectionHeading } from "@/components/ui/section-heading";
import { siteContent } from "@/lib/site-content";

export function ServicesSection() {
  return (
    <section id="services" className="section-space">
      <div className="container-shell">
        <SectionHeading
          eyebrow="Services"
          title={siteContent.services.title}
          description={siteContent.services.description}
          align="center"
        />

        <div className="mt-10 space-y-10">
          {siteContent.services.categories.map((category) => (
            <div key={category.name}>
              <div className="mb-5 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />
                <p className="text-center text-sm font-semibold uppercase tracking-[0.25em] text-accent">
                  {category.name}
                </p>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div
                className={`grid gap-5 ${
                  category.plans.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-1"
                }`}
              >
                {category.plans.map((plan) => (
                  <article
                    key={`${category.name}-${plan.name}`}
                    className={`panel flex h-full flex-col p-6 sm:p-8 ${
                      plan.featured
                        ? "border-accent/40 bg-gradient-to-b from-accent/10 to-white/5 shadow-glow"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-accent">
                          {plan.badge ?? "Coaching Package"}
                        </p>
                        <h3 className="mt-3 text-4xl uppercase leading-none text-ink">
                          {plan.name}
                        </h3>
                        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-300">
                          {plan.price}
                        </p>
                        {plan.minimumTerm ? (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                            {plan.minimumTerm}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <p className="mt-5 text-base leading-7 text-zinc-300">{plan.idealFor}</p>

                    {plan.savings ? (
                      <div className="mt-6 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                        {plan.savings}
                      </div>
                    ) : null}

                    <a
                      href={siteContent.brand.consultationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-8 inline-flex w-fit items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-accent hover:text-accent"
                    >
                      {plan.ctaLabel}
                    </a>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

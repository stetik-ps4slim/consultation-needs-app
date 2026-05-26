import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/ui/site-header";
import { siteContent } from "@/lib/site-content";

export function HeroSection() {
  return (
    <section id="top" className="relative pb-16 pt-4 sm:pb-20">
      <div className="absolute inset-0 -z-10 bg-grid bg-[size:42px_42px] opacity-[0.08]" />
      <div className="absolute inset-x-0 top-16 -z-10 mx-auto h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
      <SiteHeader />

      <div className="container-shell grid gap-10 pt-16 sm:pt-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:pt-24">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-accent">
            {siteContent.brand.eyebrow}
          </p>
          <h1 className="max-w-3xl text-5xl uppercase leading-[0.95] text-ink sm:text-6xl lg:text-7xl">
            {siteContent.hero.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
            {siteContent.hero.subheading}
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Button href={siteContent.brand.consultationLink} target="_blank" rel="noreferrer">
              {siteContent.brand.consultationLabel}
            </Button>
          </div>

          <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">
            Free 30-min call · No obligation
          </p>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {siteContent.hero.highlights.map((item) => (
              <div key={item} className="panel p-4">
                <p className="text-sm leading-6 text-zinc-200">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden border-accent/20 bg-gradient-to-br from-white/10 to-white/5 p-6 shadow-glow sm:p-8">
          <div className="rounded-[1.75rem] border border-white/10 bg-black/40 p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">What You Can Expect</p>
            <div className="mt-6 space-y-5">
              {[
                ["A Clear Plan", "Structured fat loss and lean muscle programming built around your goals and your schedule."],
                ["Real Accountability", "Weekly check-ins and direct coaching support to keep you consistent and on track."],
                ["Simple Process", "No guesswork, no fads — just a proven system that makes getting results feel straightforward."]
              ].map(([title, description]) => (
                <div key={title} className="border-b border-white/10 pb-5 last:border-none last:pb-0">
                  <h2 className="text-2xl uppercase text-ink">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import { siteContent } from "@/lib/site-content";

export function SiteHeader() {
  return (
    <header className="container-shell relative z-20 flex flex-col gap-4 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <a href="#top" className="text-lg font-semibold uppercase tracking-[0.24em] text-ink">
        {siteContent.brand.shortName}
      </a>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <a
          href="/consultation-needs"
          className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink transition hover:border-accent hover:text-accent"
        >
          Consultation App
        </a>
        <Button href={siteContent.brand.consultationLink} className="px-4 py-2 text-xs" target="_blank" rel="noreferrer">
          {siteContent.brand.consultationLabel}
        </Button>
      </div>
    </header>
  );
}

import type { SiteContent } from "@/content/site";

import { SectionHeading } from "./SectionHeading";

interface WorkProps {
  eyebrow: string;
  heading: string;
  entries: SiteContent["work"];
}

export function Work({ eyebrow, heading, entries }: WorkProps) {
  return (
    <section id="work" className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        <SectionHeading eyebrow={eyebrow} heading={heading} />
        <div className="grid gap-4 sm:grid-cols-3">
          {entries.map((entry) => (
            <article
              key={entry.slug}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-subtle/40 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:bg-subtle"
            >
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {entry.type}
              </span>
              <h3 className="text-lg font-semibold tracking-tight">
                {entry.displayTitle}
              </h3>
              <p className="text-sm leading-relaxed text-foreground/80">
                {entry.summary}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

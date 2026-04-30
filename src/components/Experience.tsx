import type { SiteContent } from "@/content/site";

import { SectionHeading } from "./SectionHeading";

interface ExperienceProps {
  eyebrow: string;
  heading: string;
  entries: SiteContent["experience"];
}

export function Experience({ eyebrow, heading, entries }: ExperienceProps) {
  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        <SectionHeading eyebrow={eyebrow} heading={heading} />
        <ol className="flex flex-col">
          {entries.map((entry, index) => (
            <li
              key={entry.slug}
              className={`grid gap-2 py-6 sm:grid-cols-[10rem_1fr] sm:gap-8 ${
                index === 0 ? "" : "border-t border-border/60"
              }`}
            >
              <div className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {entry.period}
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold tracking-tight">
                  {entry.role}
                  <span className="text-muted"> · {entry.org}</span>
                </h3>
                <p className="text-sm leading-relaxed text-foreground/80">
                  {entry.summary}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

import type { SiteContent } from "@/content/site";

import { SectionHeading } from "./SectionHeading";

interface TestimonialsProps {
  data: SiteContent["testimonials"];
}

type TestimonialItem = SiteContent["testimonials"]["items"][number];

export function Testimonials({ data }: TestimonialsProps) {
  if (data.items.length === 0) return null;

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} />
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.items.map((item: TestimonialItem, index: number) => (
            <li key={`${item.author}-${index}`}>
              <figure className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-border bg-subtle/30 p-6">
                <blockquote className="text-pretty text-base leading-relaxed text-foreground/90">
                  <span aria-hidden="true" className="text-accent">
                    “
                  </span>
                  {item.quote}
                  <span aria-hidden="true" className="text-accent">
                    ”
                  </span>
                </blockquote>
                <figcaption className="flex flex-col gap-1 border-t border-border/60 pt-4">
                  <span className="text-sm font-medium text-foreground">
                    {item.author}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    {item.role}
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

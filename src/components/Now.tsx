import type { SiteContent } from "@/content/site";

import { SectionHeading } from "./SectionHeading";

interface NowProps {
  data: SiteContent["now"];
}

export function Now({ data }: NowProps) {
  const items = [data.clubfriends, data.writing, data.investing];

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        <SectionHeading heading={data.heading} />
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.title}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-subtle/40 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-subtle"
            >
              <h3 className="text-base font-semibold tracking-tight">
                {item.title}
              </h3>
              <p className="flex-1 text-sm leading-relaxed text-muted">
                {item.body}
              </p>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                {item.meta}
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

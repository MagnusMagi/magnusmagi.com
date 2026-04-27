import type { SiteContent } from "@/content/site";

import { SectionHeading } from "./SectionHeading";

interface AboutProps {
  data: SiteContent["about"];
}

export function About({ data }: AboutProps) {
  return (
    <section id="about" className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} />
        <div className="flex max-w-2xl flex-col gap-6 text-pretty text-base leading-relaxed text-foreground/90">
          <p>{data.paragraph1}</p>
          <p>{data.paragraph2}</p>
          <p className="text-muted">{data.paragraph3}</p>
        </div>
      </div>
    </section>
  );
}

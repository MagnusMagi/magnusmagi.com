import type { SiteContent } from "@/content/site";

import { SectionHeading } from "./SectionHeading";

interface SkillsProps {
  data: SiteContent["skills"];
}

function parseChips(value: string): string[] {
  return value
    .split("·")
    .map((chip) => chip.trim())
    .filter(Boolean);
}

export function Skills({ data }: SkillsProps) {
  const groups = [data.product, data.frontend, data.backend, data.ai];

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-20">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} />
        <dl className="grid gap-10 sm:grid-cols-2 sm:gap-x-12 sm:gap-y-10">
          {groups.map((group) => {
            const chips = parseChips(group.items);
            return (
              <div key={group.title} className="flex flex-col gap-3">
                <dt className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  {group.title}
                </dt>
                <dd>
                  <ul className="flex flex-wrap gap-1.5">
                    {chips.map((chip) => (
                      <li
                        key={chip}
                        className="inline-flex items-center rounded-full border border-border bg-subtle/40 px-3 py-1 text-sm text-foreground/90"
                      >
                        {chip}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

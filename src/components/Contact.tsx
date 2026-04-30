import type { SiteContent } from "@/content/site";

import { ContactForm } from "./ContactForm";
import { SectionHeading } from "./SectionHeading";

interface ContactProps {
  data: SiteContent["contact"];
}

type SocialLink = SiteContent["contact"]["social"][number];

export function Contact({ data }: ContactProps) {
  return (
    <section id="contact" className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        <SectionHeading eyebrow={data.eyebrow} heading={data.heading} />
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <div className="flex flex-col gap-8">
            <p className="max-w-md text-pretty text-base leading-relaxed text-foreground/90">
              {data.body}
            </p>
            {data.email ? (
              <a
                href={`mailto:${data.email}`}
                className="inline-flex w-fit items-center font-mono text-xs uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                {data.email}
              </a>
            ) : null}
            {data.social.length > 0 ? (
              <div className="flex flex-col gap-3 pt-2">
                <span className="text-sm text-muted">{data.secondary}</span>
                <ul className="flex flex-wrap gap-2">
                  {data.social.map((item: SocialLink) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:border-accent/40 hover:bg-subtle hover:text-accent"
                      >
                        {item.label} ↗
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="relative">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

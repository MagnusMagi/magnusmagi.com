import Image from "next/image";
import { useTranslations } from "next-intl";

import type { SiteContent } from "@/content/site";

interface HeroProps {
  data: SiteContent["hero"];
}

export function Hero({ data }: HeroProps) {
  const t = useTranslations("Hero");
  const metaRows = [
    {
      label: data.metaLocationLabel,
      value: data.metaLocationValue,
      meta: data.metaLocationCoords,
    },
    {
      label: data.metaBuildingLabel,
      value: data.metaBuildingValue,
      meta: data.metaBuildingMeta,
    },
    {
      label: data.metaOpenLabel,
      value: data.metaOpenValue,
      meta: data.metaOpenMeta,
    },
  ];

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-12 sm:py-20 md:py-28 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
        <div className="flex flex-col gap-10">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-14 overflow-hidden rounded-full border border-border bg-subtle">
              <Image
                src="/magnus.jpg"
                alt={data.name}
                fill
                sizes="56px"
                priority
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono uppercase tracking-[0.18em]">
                {data.available}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              {data.name}
            </h1>
            <p className="max-w-2xl text-balance text-lg text-muted sm:text-xl">
              {data.tagline}
            </p>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-foreground/90">
              {data.intro}
            </p>
          </div>

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              {data.primaryCta}
            </a>
            <a
              href="#work"
              className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-subtle"
            >
              {data.secondaryCta}
            </a>
          </div>
        </div>

        <aside
          aria-label={t("metadataLabel")}
          className="w-full self-end font-mono lg:max-w-sm lg:w-72"
        >
          <dl className="grid grid-cols-3 gap-3 border-t border-border/60 pt-6 lg:grid-cols-1 lg:gap-0 lg:border-t-0 lg:pt-0">
            {metaRows.map((row, index) => (
              <div
                key={row.label}
                className={`flex flex-col gap-1 lg:gap-1.5 lg:py-4 ${
                  index === 0
                    ? ""
                    : "lg:border-t lg:border-border/60"
                }`}
              >
                <dt className="text-[10px] uppercase tracking-[0.18em] text-muted lg:text-[11px] lg:tracking-[0.22em]">
                  {row.label}
                </dt>
                <dd className="font-sans text-sm font-medium tracking-tight text-foreground lg:text-base">
                  {row.value}
                </dd>
                <dd className="text-[10px] uppercase tracking-[0.18em] text-muted lg:text-[11px]">
                  {row.meta}
                </dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </section>
  );
}

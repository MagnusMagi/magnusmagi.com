import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { getFooter } from "@/content/site";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "DesignSystems" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical:
        locale === "en" ? "/design-systems" : `/${locale}/design-systems`,
      languages: {
        en: "/design-systems",
        et: "/et/design-systems",
      },
    },
  };
}

const COLOR_TOKENS = [
  { key: "background", varName: "--background", swatch: "bg-background border" },
  { key: "foreground", varName: "--foreground", swatch: "bg-foreground" },
  { key: "muted", varName: "--muted", swatch: "bg-muted" },
  { key: "subtle", varName: "--subtle", swatch: "bg-subtle border" },
  { key: "border", varName: "--border", swatch: "bg-border" },
  { key: "accent", varName: "--accent", swatch: "bg-accent" },
] as const;

const SPACING_STEPS = [
  { token: "1", px: 4 },
  { token: "2", px: 8 },
  { token: "3", px: 12 },
  { token: "4", px: 16 },
  { token: "6", px: 24 },
  { token: "8", px: 32 },
  { token: "10", px: 40 },
  { token: "16", px: 64 },
  { token: "20", px: 80 },
] as const;

const RADIUS_STEPS = [
  { token: "sm", className: "rounded-sm", px: 2 },
  { token: "md", className: "rounded-md", px: 6 },
  { token: "lg", className: "rounded-lg", px: 8 },
  { token: "xl", className: "rounded-xl", px: 12 },
  { token: "2xl", className: "rounded-2xl", px: 16 },
  { token: "full", className: "rounded-full", px: 9999 },
] as const;

export default async function DesignSystemsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "DesignSystems" });
  const footer = await getFooter(locale as Locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20 md:py-24">
            <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} />
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted">
              {t("subhead")}
            </p>
            <p className="mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-muted">
              {t("intro")}
            </p>
          </div>
        </section>

        {/* Foundations */}
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="mb-10 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t("sections.foundations")}
            </h2>

            {/* Colors */}
            <div className="mb-16">
              <h3 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.colors")}
              </h3>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
                {t("sections.colorsDesc")}
              </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {COLOR_TOKENS.map((token) => (
                  <li
                    key={token.key}
                    className="flex flex-col gap-2 rounded-md border border-border p-3"
                  >
                    <div
                      className={`aspect-square w-full rounded-sm border-border ${token.swatch}`}
                      aria-hidden
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium tracking-tight">
                        {t(`tokens.${token.key}` as never)}
                      </span>
                      <code className="font-mono text-[11px] text-muted">
                        {token.varName}
                      </code>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Typography */}
            <div className="mb-16">
              <h3 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.typography")}
              </h3>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
                {t("sections.typographyDesc")}
              </p>
              <div className="flex flex-col gap-6 rounded-md border border-border p-6 sm:p-8">
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    H1 · 4xl–6xl · 600
                  </span>
                  <p className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                    {t("examples.displayHeading")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    H2 · 2xl–3xl · 600
                  </span>
                  <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    {t("examples.sectionHeading")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    Subhead · base · muted
                  </span>
                  <p className="text-base leading-relaxed text-muted">
                    {t("examples.subhead")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    Body · sm/base · 1.7
                  </span>
                  <p className="text-sm leading-relaxed sm:text-base">
                    {t("examples.body")}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    Mono · xs · 0.18em
                  </span>
                  <p className="font-mono text-xs uppercase tracking-[0.18em]">
                    {t("examples.mono")}
                  </p>
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div className="mb-16">
              <h3 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.spacing")}
              </h3>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
                {t("sections.spacingDesc")}
              </p>
              <ul className="flex flex-col gap-3 rounded-md border border-border p-6 sm:p-8">
                {SPACING_STEPS.map((step) => (
                  <li
                    key={step.token}
                    className="flex items-center gap-4 text-sm"
                  >
                    <code className="w-12 shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                      {step.token}
                    </code>
                    <code className="w-16 shrink-0 font-mono text-[11px] text-muted">
                      {step.px}px
                    </code>
                    <span
                      className="h-3 rounded-sm bg-accent/80"
                      style={{ width: `${step.px}px` }}
                      aria-hidden
                    />
                  </li>
                ))}
              </ul>
            </div>

            {/* Radius */}
            <div className="mb-16">
              <h3 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.radius")}
              </h3>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
                {t("sections.radiusDesc")}
              </p>
              <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                {RADIUS_STEPS.map((step) => (
                  <li
                    key={step.token}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={`flex h-16 w-16 items-center justify-center border border-border bg-subtle ${step.className}`}
                      aria-hidden
                    />
                    <code className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                      {step.token}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            {/* Motion */}
            <div>
              <h3 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.motion")}
              </h3>
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted">
                {t("sections.motionDesc")}
              </p>
              <ul className="grid gap-3 sm:grid-cols-3">
                <li className="rounded-md border border-border p-4">
                  <code className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    duration · 180ms
                  </code>
                  <p className="mt-2 text-sm leading-relaxed">tile pop, hover</p>
                </li>
                <li className="rounded-md border border-border p-4">
                  <code className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    duration · 200ms
                  </code>
                  <p className="mt-2 text-sm leading-relaxed">link underline</p>
                </li>
                <li className="rounded-md border border-border p-4">
                  <code className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    easing · ease-out
                  </code>
                  <p className="mt-2 text-sm leading-relaxed">all transitions</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Elements */}
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="mb-10 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t("sections.elements")}
            </h2>

            <div className="mb-12">
              <h3 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.buttons")}
              </h3>
              <div className="flex flex-wrap gap-3 rounded-md border border-border p-6">
                <button
                  type="button"
                  className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
                >
                  {t("examples.primary")}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
                >
                  {t("examples.secondary")}
                </button>
                <button
                  type="button"
                  className="rounded-md px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-accent"
                >
                  {t("examples.ghost")}
                </button>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.links")}
              </h3>
              <div className="flex flex-col gap-3 rounded-md border border-border p-6 text-sm leading-relaxed">
                <p>
                  <a
                    href="#"
                    className="text-accent underline decoration-accent/40 underline-offset-4 transition-[text-decoration-color] hover:decoration-accent"
                  >
                    {t("examples.link")}
                  </a>{" "}
                  — inline within prose.
                </p>
                <p>
                  <a
                    href="#"
                    className="font-mono text-xs uppercase tracking-[0.18em] underline-offset-4 transition-colors hover:text-accent hover:underline"
                  >
                    Mono link ↗
                  </a>{" "}
                  — used in metadata strips.
                </p>
              </div>
            </div>

            <div className="mb-12">
              <h3 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.chips")}
              </h3>
              <div className="flex flex-wrap gap-2 rounded-md border border-border p-6">
                {[t("examples.tag"), t("examples.tag2"), t("examples.tag3")].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-subtle px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>

            <div className="mb-12">
              <h3 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.cards")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="group rounded-md border border-border bg-background p-6 transition-colors hover:border-accent hover:bg-subtle">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    META · LABEL
                  </span>
                  <h4 className="mt-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {t("examples.cardTitle")}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t("examples.cardBody")}
                  </p>
                </div>
                <div className="group rounded-md border border-border bg-background p-6 transition-colors hover:border-accent hover:bg-subtle">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    META · LABEL
                  </span>
                  <h4 className="mt-2 text-lg font-semibold tracking-tight transition-colors group-hover:text-accent">
                    {t("examples.cardTitle")}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t("examples.cardBody")}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-4 text-xl font-semibold tracking-tight sm:text-2xl">
                {t("sections.form")}
              </h3>
              <div className="flex max-w-md flex-col gap-3 rounded-md border border-border p-6">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    {t("examples.inputLabel")}
                  </span>
                  <input
                    type="email"
                    placeholder={t("examples.inputPlaceholder")}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm transition-colors focus:border-accent focus:outline-none"
                    aria-label={t("examples.inputLabel")}
                    disabled
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        {/* Patterns */}
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="mb-10 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t("sections.patterns")}
            </h2>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-md border border-border p-6 sm:p-8">
                <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {t("sections.sectionHeading")}
                </span>
                <SectionHeading
                  eyebrow={t("eyebrow")}
                  heading={t("examples.sectionHeading")}
                />
                <p className="text-sm leading-relaxed text-muted">
                  {t("examples.subhead")}
                </p>
              </div>

              <div className="rounded-md border border-border p-6 sm:p-8">
                <span className="mb-4 block font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {t("sections.monoMeta")}
                </span>
                <ul className="flex flex-col gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
                  <li>2026 · TALLINN</li>
                  <li>FOUNDER · ENGINEER</li>
                  <li>EN · ET</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section>
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2 className="mb-10 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t("sections.principles")}
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((n) => (
                <li
                  key={n}
                  className="flex flex-col gap-2 rounded-md border border-border p-6 sm:p-8"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    0{n}
                  </span>
                  <h3 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {t(`sections.principle${n}Title` as never)}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">
                    {t(`sections.principle${n}Body` as never)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </div>
  );
}

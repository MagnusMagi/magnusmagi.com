import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { getFooter } from "@/content/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Play" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: locale === "en" ? "/play" : `/${locale}/play`,
      languages: {
        en: "/play",
        et: "/et/play",
      },
    },
  };
}

export default async function PlayHubPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Play" });
  const footer = await getFooter(locale as Locale);

  const games = [
    {
      href: "/play/magibird",
      title: t("magibird.cardTitle"),
      description: t("magibird.cardDescription"),
      meta: t("magibird.cardMeta"),
    },
    {
      href: "/play/2049",
      title: t("g2049.cardTitle"),
      description: t("g2049.cardDescription"),
      meta: t("g2049.cardMeta"),
    },
    {
      href: "/play/snake",
      title: t("snake.cardTitle"),
      description: t("snake.cardDescription"),
      meta: t("snake.cardMeta"),
    },
    {
      href: "/play/mines",
      title: t("mines.cardTitle"),
      description: t("mines.cardDescription"),
      meta: t("mines.cardMeta"),
    },
  ] as const;

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
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <li key={game.href}>
                  <Link
                    href={game.href}
                    className="group flex h-full flex-col justify-between gap-6 rounded-md border border-border bg-background p-6 transition-colors hover:border-accent hover:bg-subtle"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                        {game.meta}
                      </span>
                      <h2 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-accent sm:text-2xl">
                        {game.title}
                      </h2>
                      <p className="text-sm leading-relaxed text-muted">
                        {game.description}
                      </p>
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors group-hover:text-accent">
                      {t("playArrow")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-12 flex flex-col gap-2 border-t border-border/60 pt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
              <p className="text-pretty leading-relaxed">
                {t("notes.privacy")}
              </p>
              <p className="text-pretty leading-relaxed">
                {t("notes.credits")}
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MagiMines } from "@/components/MagiMines";
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
  const t = await getTranslations({ locale, namespace: "Play.mines" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: locale === "en" ? "/play/mines" : `/${locale}/play/mines`,
      languages: {
        en: "/play/mines",
        et: "/et/play/mines",
      },
    },
  };
}

export default async function MagiMinesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Play.mines" });
  const tHub = await getTranslations({ locale, namespace: "Play" });
  const footer = await getFooter(locale as Locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-16 md:py-20">
            <Link
              href="/play"
              className="inline-flex min-h-9 items-center gap-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              ← {tHub("backToHub")}
            </Link>
            <div className="mt-6">
              <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} />
              <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted">
                {t("subhead")}
              </p>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
            <MagiMines
              labels={{
                mines: t("mines"),
                time: t("time"),
                best: t("best"),
                newGame: t("newGame"),
                easy: t("easy"),
                hard: t("hard"),
                youWon: t("youWon"),
                gameOver: t("gameOver"),
                controlsHint: t("controlsHint"),
                ariaLabel: t("ariaLabel"),
                flagAria: t("flagAria"),
                mineAria: t("mineAria"),
                hiddenAria: t("hiddenAria"),
                restart: t("restart"),
              }}
            />
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </div>
  );
}

import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { TagChip } from "@/components/TagChip";
import { getFooter } from "@/content/site";
import { getAllPosts, getAllTags } from "@/content/writing";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Writing" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: locale === "en" ? "/writing" : `/${locale}/writing`,
      languages: {
        en: "/writing",
        et: "/et/writing",
      },
    },
  };
}

export default async function WritingIndexPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Writing" });
  const [posts, tags, footer] = await Promise.all([
    getAllPosts(locale),
    getAllTags(locale),
    getFooter(locale as Locale),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-24">
            <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} />
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted">
              {t("subhead")}
            </p>
            {tags.length > 0 ? (
              <ul className="mt-8 flex flex-wrap gap-2">
                {tags.map(({ tag, count }) => (
                  <li key={tag}>
                    <TagChip tag={tag} count={count} />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            {posts.length === 0 ? (
              <p className="text-base text-muted">{t("empty")}</p>
            ) : (
              <ul className="flex flex-col">
                {posts.map((post, index) => (
                  <li
                    key={post.slug}
                    className={
                      index === 0 ? "" : "border-t border-border/60"
                    }
                  >
                    <Link
                      href={`/writing/${post.slug}`}
                      className="group grid gap-2 py-8 transition-colors sm:grid-cols-[10rem_1fr] sm:gap-8"
                    >
                      <div className="flex flex-col gap-1">
                        <time
                          dateTime={post.frontmatter.publishedAt}
                          className="font-mono text-xs uppercase tracking-[0.18em] text-muted"
                        >
                          {formatDate(post.frontmatter.publishedAt, locale)}
                        </time>
                        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                          {t("readingTime", { minutes: post.readingMinutes })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <h2 className="text-xl font-semibold tracking-tight transition-colors group-hover:text-accent sm:text-2xl">
                          {post.frontmatter.title}
                        </h2>
                        <p className="max-w-2xl text-pretty text-sm leading-relaxed text-muted">
                          {post.frontmatter.description}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
      <Footer data={footer} />
    </div>
  );
}

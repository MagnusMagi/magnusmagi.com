import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SectionHeading } from "@/components/SectionHeading";
import { TagChip } from "@/components/TagChip";
import { getFooter } from "@/content/site";
import { getAllTags, getPostsByTag } from "@/content/writing";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; tag: string }>;
}

export async function generateStaticParams() {
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const tags = await getAllTags(locale);
      return tags.map(({ tag }) => ({ locale, tag }));
    }),
  );
  return entries.flat();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const t = await getTranslations({ locale, namespace: "Writing" });
  return {
    title: `#${decodedTag} — ${t("metaTitle")}`,
    description: t("tagArchiveSubhead"),
  };
}

export default async function TagArchivePage({ params }: PageProps) {
  const { locale, tag } = await params;
  setRequestLocale(locale);

  const decodedTag = decodeURIComponent(tag);
  const t = await getTranslations({ locale, namespace: "Writing" });
  const [posts, footer] = await Promise.all([
    getPostsByTag(locale, decodedTag),
    getFooter(locale as Locale),
  ]);

  if (posts.length === 0) {
    const tags = await getAllTags(locale);
    if (!tags.some((entry) => entry.tag === decodedTag)) notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <section className="border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20 md:py-24">
            <Link
              href="/writing"
              className="font-mono text-xs uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              ← {t("backToList")}
            </Link>
            <div className="mt-6">
              <SectionHeading
                eyebrow={t("eyebrow")}
                heading={t("tagArchiveHeading", { tag: decodedTag })}
              />
            </div>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted">
              {t("tagArchiveSubhead")}
            </p>
          </div>
        </section>

        <section>
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            {posts.length === 0 ? (
              <p className="text-base text-muted">{t("tagArchiveEmpty")}</p>
            ) : (
              <ul className="flex flex-col">
                {posts.map((post, index) => (
                  <li
                    key={post.slug}
                    className={index === 0 ? "" : "border-t border-border/60"}
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

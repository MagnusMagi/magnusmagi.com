import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getAllPosts } from "@/content/writing";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";

import { SectionHeading } from "./SectionHeading";

interface LatestWritingProps {
  locale: Locale;
  limit?: number;
}

export async function LatestWriting({ locale, limit = 3 }: LatestWritingProps) {
  const [posts, t] = await Promise.all([
    getAllPosts(locale),
    getTranslations({ locale, namespace: "Writing" }),
  ]);

  const latest = posts.slice(0, limit);
  if (latest.length === 0) return null;

  return (
    <section className="border-b border-border/60">
      <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-20">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} />
          <Link
            href="/writing"
            className="hidden font-mono text-xs uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-accent hover:underline sm:inline-flex"
          >
            {t("backToList")} →
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {latest.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/writing/${post.slug}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-subtle/40 p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/40"
              >
                <time
                  dateTime={post.frontmatter.publishedAt}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
                >
                  {formatDate(post.frontmatter.publishedAt, locale)}
                </time>
                <h3 className="text-base font-semibold tracking-tight transition-colors group-hover:text-accent">
                  {post.frontmatter.title}
                </h3>
                <p className="flex-1 text-sm leading-relaxed text-muted">
                  {post.frontmatter.description}
                </p>
                <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                  {t("readingTime", { minutes: post.readingMinutes })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/writing"
          className="mt-6 inline-flex font-mono text-xs uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-accent hover:underline sm:hidden"
        >
          {t("backToList")} →
        </Link>
      </div>
    </section>
  );
}

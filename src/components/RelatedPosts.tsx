import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import type { Post } from "@/content/writing";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";

interface RelatedPostsProps {
  posts: Post[];
  locale: Locale;
}

export async function RelatedPosts({ posts, locale }: RelatedPostsProps) {
  if (posts.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "Writing" });

  return (
    <section
      aria-label={t("related")}
      className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8"
    >
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
        {t("related")}
      </span>
      <ul className="grid gap-3 sm:grid-cols-3">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/writing/${post.slug}`}
              className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-subtle/30 p-4 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <time
                dateTime={post.frontmatter.publishedAt}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
              >
                {formatDate(post.frontmatter.publishedAt, locale)}
              </time>
              <span className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                {post.frontmatter.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

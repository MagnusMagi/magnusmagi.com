import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { TagChip } from "@/components/TagChip";
import { getFooter } from "@/content/site";
import { getAllPosts, getPostBySlug } from "@/content/writing";
import type { Locale } from "@/i18n/routing";
import { formatDate } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const entries = await Promise.all(
    routing.locales.map(async (locale) => {
      const posts = await getAllPosts(locale);
      return posts.map((post) => ({ locale, slug: post.slug }));
    }),
  );
  return entries.flat();
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug(locale, slug);
  if (!post) return {};

  return {
    title: `${post.frontmatter.title} — Magnus Mägi`,
    description: post.frontmatter.description,
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      publishedTime: post.frontmatter.publishedAt,
    },
  };
}

export default async function WritingPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Writing" });
  const [post, footer] = await Promise.all([
    getPostBySlug(locale, slug),
    getFooter(locale as Locale),
  ]);
  if (!post) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-6 py-20">
          <Link
            href="/writing"
            className="font-mono text-xs uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            ← {t("backToList")}
          </Link>
          <header className="mt-10 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              <time dateTime={post.frontmatter.publishedAt}>
                {formatDate(post.frontmatter.publishedAt, locale)}
              </time>
              <span aria-hidden="true">·</span>
              <span>
                {t("readingTime", { minutes: post.readingMinutes })}
              </span>
            </div>
            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {post.frontmatter.title}
            </h1>
            <p className="text-pretty text-lg text-muted">
              {post.frontmatter.description}
            </p>
          </header>

          {post.frontmatter.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/writing-images/${post.frontmatter.coverImage}`}
              alt={post.frontmatter.coverAlt ?? ""}
              className="mt-10 w-full rounded-2xl border border-border"
            />
          ) : null}

          <div className="prose mt-12">
            <MDXRemote source={post.content} />
          </div>

          {post.frontmatter.tags.length > 0 ? (
            <footer className="mt-16 flex flex-col gap-3 border-t border-border/60 pt-8">
              <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
                {t("tagsLabel")}
              </span>
              <ul className="flex flex-wrap gap-2">
                {post.frontmatter.tags.map((tag) => (
                  <li key={tag}>
                    <TagChip tag={tag} />
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </article>
      </main>
      <Footer data={footer} />
    </div>
  );
}

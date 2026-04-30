import type { Metadata } from "next";
import Image from "next/image";
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

const SITE_URL = "https://magnusmagi.com";

function postUrl(locale: string, slug: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}/writing/${slug}`;
}

function writingIndexUrl(locale: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}/writing`;
}

function homeUrl(locale: string): string {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}`;
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
    alternates: {
      canonical: postUrl(locale, slug),
    },
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      publishedTime: post.frontmatter.publishedAt,
      url: postUrl(locale, slug),
      authors: ["Magnus Mägi"],
      tags: post.frontmatter.tags,
      locale: locale === "et" ? "et_EE" : "en_US",
    },
  };
}

export default async function WritingPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Writing" });
  const [post, footer, allPosts] = await Promise.all([
    getPostBySlug(locale, slug),
    getFooter(locale as Locale),
    getAllPosts(locale),
  ]);
  if (!post) notFound();

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const newerPost =
    currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(locale, slug) },
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    datePublished: post.frontmatter.publishedAt,
    dateModified: post.frontmatter.publishedAt,
    inLanguage: locale === "et" ? "et-EE" : "en-US",
    keywords: post.frontmatter.tags.join(", "),
    author: {
      "@type": "Person",
      name: "Magnus Mägi",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Magnus Mägi",
      url: SITE_URL,
    },
    ...(post.frontmatter.coverImage
      ? {
          image: `${SITE_URL}/writing-images/${post.frontmatter.coverImage}`,
        }
      : {}),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: homeUrl(locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Writing",
        item: writingIndexUrl(locale),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.frontmatter.title,
        item: postUrl(locale, slug),
      },
    ],
  };

  return (
    <div className="flex min-h-screen flex-col">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Header />
      <main id="main" className="flex-1">
        <article className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-20">
          <Link
            href="/writing"
            className="inline-flex min-h-9 items-center font-mono text-xs uppercase tracking-[0.18em] text-muted underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
            <Image
              src={`/writing-images/${post.frontmatter.coverImage}`}
              alt={post.frontmatter.coverAlt ?? ""}
              width={1600}
              height={900}
              sizes="(min-width: 768px) 672px, 100vw"
              className="mt-10 h-auto w-full rounded-2xl border border-border"
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

          {newerPost || olderPost ? (
            <nav
              aria-label={t("postNavLabel")}
              className="mt-16 grid gap-4 border-t border-border/60 pt-8 sm:grid-cols-2"
            >
              {newerPost ? (
                <Link
                  href={`/writing/${newerPost.slug}`}
                  rel="prev"
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-subtle/30 p-5 transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    ← {t("newer")}
                  </span>
                  <span className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                    {newerPost.frontmatter.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
              {olderPost ? (
                <Link
                  href={`/writing/${olderPost.slug}`}
                  rel="next"
                  className="group flex flex-col gap-2 rounded-xl border border-border bg-subtle/30 p-5 text-right transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:text-right"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                    {t("older")} →
                  </span>
                  <span className="text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-accent">
                    {olderPost.frontmatter.title}
                  </span>
                </Link>
              ) : (
                <span aria-hidden="true" />
              )}
            </nav>
          ) : null}
        </article>
      </main>
      <Footer data={footer} />
    </div>
  );
}

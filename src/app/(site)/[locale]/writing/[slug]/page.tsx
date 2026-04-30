import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getTranslations, setRequestLocale } from "next-intl/server";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { Breadcrumb } from "@/components/Breadcrumb";
import { CodeCopyButtons } from "@/components/CodeCopyButtons";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PostShare } from "@/components/PostShare";
import { PostToc } from "@/components/PostToc";
import { PostTranslationProvider } from "@/components/PostTranslationProvider";
import { ReadingProgress } from "@/components/ReadingProgress";
import { RelatedPosts } from "@/components/RelatedPosts";
import { TagChip } from "@/components/TagChip";
import { getContact, getFooter } from "@/content/site";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/content/writing";
import { extractToc } from "@/lib/toc";
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

  const languages: Record<string, string> = { [locale]: postUrl(locale, slug) };
  for (const [otherLocale, otherSlug] of Object.entries(post.frontmatter.translations)) {
    languages[otherLocale] = postUrl(otherLocale, otherSlug);
  }

  const alternateLocales = Object.keys(post.frontmatter.translations)
    .filter((other) => other !== locale)
    .map((other) => (other === "et" ? "et_EE" : "en_US"));

  return {
    title: `${post.frontmatter.title} — Magnus Mägi`,
    description: post.frontmatter.description,
    alternates: {
      canonical: postUrl(locale, slug),
      languages,
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
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      creator: "@magnusmagi",
    },
  };
}

export default async function WritingPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Writing" });
  const tBreadcrumb = await getTranslations({ locale, namespace: "Breadcrumb" });
  const [post, footer, allPosts, contact, related] = await Promise.all([
    getPostBySlug(locale, slug),
    getFooter(locale as Locale),
    getAllPosts(locale),
    getContact(locale as Locale),
    getRelatedPosts(locale, slug, 3),
  ]);
  if (!post) notFound();

  const toc = extractToc(post.content);

  const otherLocaleEntries = Object.entries(post.frontmatter.translations) as Array<[
    Locale,
    string,
  ]>;
  const translationSlugs: Partial<Record<Locale, string>> = { [locale as Locale]: slug };
  for (const [otherLocale, otherSlug] of otherLocaleEntries) {
    translationSlugs[otherLocale] = otherSlug;
  }
  const otherLocale = otherLocaleEntries.find(([l]) => l !== locale)?.[0];
  const otherSlug = otherLocale ? translationSlugs[otherLocale] : undefined;
  const translationLanguageLabel = otherLocale
    ? t(otherLocale === "et" ? "languageEt" : "languageEn")
    : null;

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const newerPost =
    currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const olderPost =
    currentIndex >= 0 && currentIndex < allPosts.length - 1
      ? allPosts[currentIndex + 1]
      : null;

  const dateModified = post.frontmatter.updatedAt ?? post.frontmatter.publishedAt;
  const publisherLogo = `${SITE_URL}/icon.svg`;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(locale, slug) },
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    datePublished: `${post.frontmatter.publishedAt}T00:00:00Z`,
    dateModified: `${dateModified}T00:00:00Z`,
    inLanguage: locale === "et" ? "et-EE" : "en-US",
    keywords: post.frontmatter.tags.join(", "),
    wordCount: post.wordCount,
    timeRequired: `PT${post.readingMinutes}M`,
    isAccessibleForFree: true,
    ...(post.frontmatter.section ? { articleSection: post.frontmatter.section } : {}),
    author: {
      "@type": "Person",
      name: "Magnus Mägi",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Magnus Mägi",
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: publisherLogo,
        width: 512,
        height: 512,
      },
    },
    ...(post.frontmatter.coverImage
      ? {
          image: [
            {
              "@type": "ImageObject",
              url: `${SITE_URL}/writing-images/${post.frontmatter.coverImage}`,
              width: 1600,
              height: 900,
            },
          ],
        }
      : {}),
    ...(post.frontmatter.originalLocale &&
    post.frontmatter.originalLocale !== locale &&
    post.frontmatter.translations[post.frontmatter.originalLocale]
      ? {
          translationOfWork: {
            "@type": "BlogPosting",
            "@id": postUrl(
              post.frontmatter.originalLocale,
              post.frontmatter.translations[post.frontmatter.originalLocale]!,
            ),
            inLanguage:
              post.frontmatter.originalLocale === "et" ? "et-EE" : "en-US",
          },
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
        name: tBreadcrumb("home"),
        item: homeUrl(locale),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tBreadcrumb("writing"),
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
      <ReadingProgress />
      <PostTranslationProvider value={{ basePath: "/writing", slugs: translationSlugs }}>
        <Header />
      </PostTranslationProvider>
      <main id="main" className="flex-1">
        <article
          aria-labelledby="post-title"
          className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-20"
        >
          <Breadcrumb
            ariaLabel={tBreadcrumb("writing")}
            items={[
              { label: tBreadcrumb("home"), href: "/" },
              { label: tBreadcrumb("writing"), href: "/writing" },
              { label: post.frontmatter.title },
            ]}
          />
          <header className="mt-8 flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
              <time dateTime={`${post.frontmatter.publishedAt}T00:00:00Z`}>
                {formatDate(post.frontmatter.publishedAt, locale)}
              </time>
              <span aria-hidden="true">·</span>
              <span>
                {t("readingTime", { minutes: post.readingMinutes })}
              </span>
              {post.frontmatter.updatedAt &&
              post.frontmatter.updatedAt !== post.frontmatter.publishedAt ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {t("updatedAt", {
                      date: formatDate(post.frontmatter.updatedAt, locale),
                    })}
                  </span>
                </>
              ) : null}
            </div>
            <h1
              id="post-title"
              className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl"
            >
              {post.frontmatter.title}
            </h1>
            <p className="text-pretty text-lg text-muted">
              {post.frontmatter.description}
            </p>
            {otherLocale && otherSlug && translationLanguageLabel ? (
              <Link
                href={`/writing/${otherSlug}`}
                locale={otherLocale}
                className="inline-flex min-h-9 w-fit items-center gap-2 rounded-full border border-border bg-subtle/40 px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <span aria-hidden="true">🌐</span>
                {t("translationAvailable", { language: translationLanguageLabel })}
                <span aria-hidden="true">→</span>
              </Link>
            ) : null}
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

          <PostToc entries={toc} locale={locale as Locale} />

          <div className="prose mt-12">
            <CodeCopyButtons />
            <MDXRemote
              source={post.content}
              options={{
                mdxOptions: {
                  remarkPlugins: [remarkGfm],
                  rehypePlugins: [
                    rehypeSlug,
                    [
                      rehypeAutolinkHeadings,
                      {
                        behavior: "append",
                        properties: {
                          className: ["anchor"],
                          "aria-label": "Permalink to this heading",
                        },
                        content: { type: "text", value: "#" },
                      },
                    ],
                    [
                      rehypePrettyCode,
                      {
                        theme: { light: "github-light", dark: "github-dark" },
                        keepBackground: false,
                      },
                    ],
                  ],
                },
              }}
            />
          </div>

          <section
            aria-label={t("shareLabel")}
            className="mt-16 flex flex-col gap-3 border-t border-border/60 pt-8"
          >
            <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
              {t("shareLabel")}
            </span>
            <PostShare
              url={postUrl(locale, slug)}
              title={post.frontmatter.title}
              emailTo={contact.email}
            />
          </section>

          {post.frontmatter.tags.length > 0 ? (
            <footer className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-8">
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

          <RelatedPosts posts={related} locale={locale as Locale} />

          {newerPost || olderPost ? (
            <nav
              aria-label={t("postNavLabel")}
              className="mt-12 grid gap-4 border-t border-border/60 pt-8 sm:grid-cols-2"
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

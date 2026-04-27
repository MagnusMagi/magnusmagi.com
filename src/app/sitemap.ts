import type { MetadataRoute } from "next";

import { getAllPosts, getAllTags } from "@/content/writing";
import { routing } from "@/i18n/routing";

const BASE_URL = "https://magnusmagi.com";

function localeUrl(locale: string, path = ""): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

function alternates(path = ""): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, localeUrl(locale, path)]),
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const homeEntries: MetadataRoute.Sitemap = routing.locales.map((locale) => ({
    url: localeUrl(locale),
    lastModified,
    changeFrequency: "monthly",
    priority: locale === routing.defaultLocale ? 1 : 0.8,
    alternates: { languages: alternates() },
  }));

  const writingIndexEntries: MetadataRoute.Sitemap = routing.locales.map(
    (locale) => ({
      url: localeUrl(locale, "/writing"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.7,
      alternates: { languages: alternates("/writing") },
    }),
  );

  const dataByLocale = await Promise.all(
    routing.locales.map(async (locale) => ({
      locale,
      posts: await getAllPosts(locale),
      tags: await getAllTags(locale),
    })),
  );

  const postEntries: MetadataRoute.Sitemap = dataByLocale.flatMap(
    ({ locale, posts }) =>
      posts.map((post) => ({
        url: localeUrl(locale, `/writing/${post.slug}`),
        lastModified: new Date(post.frontmatter.publishedAt),
        changeFrequency: "yearly",
        priority: 0.6,
      })),
  );

  const tagEntries: MetadataRoute.Sitemap = dataByLocale.flatMap(
    ({ locale, tags }) =>
      tags.map(({ tag }) => ({
        url: localeUrl(locale, `/writing/tag/${encodeURIComponent(tag)}`),
        lastModified,
        changeFrequency: "monthly",
        priority: 0.5,
      })),
  );

  return [
    ...homeEntries,
    ...writingIndexEntries,
    ...postEntries,
    ...tagEntries,
  ];
}

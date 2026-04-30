import { getAllPosts } from "@/content/writing";
import type { Locale } from "@/i18n/routing";

const BASE_URL = "https://magnusmagi.com";

const channelMeta: Record<Locale, { title: string; description: string }> = {
  en: {
    title: "Magnus Mägi — Writing",
    description: "Notes by Magnus Mägi on building software, founders, and tools.",
  },
  et: {
    title: "Magnus Mägi — Kirjutised",
    description: "Magnus Mägi märkmed tarkvara ehitamisest, asutajatest ja tööriistadest.",
  },
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function localePrefix(locale: Locale): string {
  return locale === "en" ? "" : `/${locale}`;
}

export async function buildRssFeed(locale: Locale): Promise<string> {
  const posts = await getAllPosts(locale);
  const updated = new Date().toUTCString();
  const meta = channelMeta[locale];
  const prefix = localePrefix(locale);
  const feedPath = `${prefix}/feed.xml`;
  const writingIndex = `${BASE_URL}${prefix}/writing`;

  const items = posts
    .map((post) => {
      const url = `${BASE_URL}${prefix}/writing/${post.slug}`;
      const pubDate = new Date(post.frontmatter.publishedAt).toUTCString();
      return `    <item>
      <title>${escapeXml(post.frontmatter.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.frontmatter.description)}</description>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(meta.title)}</title>
    <link>${writingIndex}</link>
    <description>${escapeXml(meta.description)}</description>
    <language>${locale}</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <atom:link href="${BASE_URL}${feedPath}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

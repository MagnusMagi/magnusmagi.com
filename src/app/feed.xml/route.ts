import { getAllPosts } from "@/content/writing";

const BASE_URL = "https://magnusmagi.com";
const FEED_LOCALE = "en";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const posts = await getAllPosts(FEED_LOCALE);
  const updated = new Date().toUTCString();

  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/writing/${post.slug}`;
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Magnus Mägi — Writing</title>
    <link>${BASE_URL}/writing</link>
    <description>Notes by Magnus Mägi on building software, founders, and tools.</description>
    <language>en</language>
    <lastBuildDate>${updated}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

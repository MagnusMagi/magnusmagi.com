const BASE_URL = "https://magnusmagi.com";

const body = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /keystatic",
  "Disallow: /keystatic/",
  "Disallow: /api/keystatic/",
  "Disallow: /api/admin/",
  "Disallow: /login",
  "",
  "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
  "",
  `Sitemap: ${BASE_URL}/sitemap.xml`,
  `Host: ${BASE_URL}`,
  "",
].join("\n");

export function GET(): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}

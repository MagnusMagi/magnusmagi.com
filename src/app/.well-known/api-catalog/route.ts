const BASE = "https://magnusmagi.com";

const linkset = {
  linkset: [
    {
      anchor: `${BASE}/`,
      "service-doc": [
        { href: `${BASE}/.well-known/agent-skills/index.json`, type: "application/json" },
      ],
      describedby: [
        { href: `${BASE}/.well-known/agent-skills/markdown-negotiation/SKILL.md`, type: "text/markdown" },
      ],
    },
    {
      anchor: `${BASE}/api/markdown`,
      "service-desc": [
        { href: `${BASE}/.well-known/agent-skills/markdown-negotiation/SKILL.md`, type: "text/markdown" },
      ],
      "service-doc": [
        { href: `${BASE}/.well-known/agent-skills/markdown-negotiation/SKILL.md`, type: "text/markdown" },
      ],
    },
    {
      anchor: `${BASE}/feed.xml`,
      "service-desc": [
        { href: "https://www.rssboard.org/rss-specification", type: "text/html" },
      ],
      type: "application/rss+xml",
    },
    {
      anchor: `${BASE}/sitemap.xml`,
      "service-desc": [
        { href: "https://www.sitemaps.org/protocol.html", type: "text/html" },
      ],
      type: "application/xml",
    },
    {
      anchor: `${BASE}/api/contact`,
      "service-doc": [{ href: `${BASE}/`, type: "text/html" }],
      "service-meta": [{ method: "POST", contentType: "application/json" }],
    },
  ],
};

const body = JSON.stringify(linkset, null, 2);

export function GET(): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/linkset+json",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

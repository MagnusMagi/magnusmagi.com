const BASE = "https://magnusmagi.com";

const metadata = {
  resource: BASE,
  authorization_servers: [],
  scopes_supported: [],
  bearer_methods_supported: [],
  resource_documentation: `${BASE}/.well-known/agent-skills/index.json`,
};

const body = JSON.stringify(metadata, null, 2);

export function GET(): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

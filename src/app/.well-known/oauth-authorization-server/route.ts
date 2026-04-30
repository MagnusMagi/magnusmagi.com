const BASE = "https://magnusmagi.com";

const metadata = {
  issuer: BASE,
  response_types_supported: [],
  grant_types_supported: [],
  token_endpoint_auth_methods_supported: [],
  service_documentation: `${BASE}/.well-known/agent-skills/index.json`,
  ui_locales_supported: ["en", "et"],
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

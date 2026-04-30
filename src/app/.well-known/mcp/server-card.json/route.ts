const BASE = "https://magnusmagi.com";

const card = {
  serverInfo: {
    name: "magnusmagi-com",
    version: "0.1.0",
    title: "Magnus Mägi · Site",
    description:
      "Read-only context surface for the magnusmagi.com portfolio. Tools are exposed in-browser via WebMCP; markdown content negotiation is available via Accept: text/markdown.",
  },
  transport: {
    type: "webmcp",
    endpoint: BASE,
  },
  capabilities: {
    tools: { listChanged: false },
    resources: { listChanged: false, subscribe: false },
    prompts: { listChanged: false },
    logging: {},
  },
  documentation: {
    skills: `${BASE}/.well-known/agent-skills/index.json`,
    markdownNegotiation: `${BASE}/.well-known/agent-skills/markdown-negotiation/SKILL.md`,
    apiCatalog: `${BASE}/.well-known/api-catalog`,
  },
};

const body = JSON.stringify(card, null, 2);

export function GET(): Response {
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

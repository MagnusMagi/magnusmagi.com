import { createHash } from "node:crypto";

const BASE_URL = "https://magnusmagi.com";

export interface AgentSkill {
  name: string;
  type: string;
  description: string;
  url: string;
  sha256: string;
}

interface SkillSource {
  name: string;
  type: string;
  description: string;
  body: string;
}

const skillSources: SkillSource[] = [
  {
    name: "api-catalog",
    type: "discovery",
    description:
      "Lists the public endpoints (markdown handler, RSS feed, sitemap, contact endpoint) per RFC 9727 at /.well-known/api-catalog.",
    body: [
      "# Skill: api-catalog",
      "",
      "Implementation: `/.well-known/api-catalog` returns `application/linkset+json` per RFC 9727, listing the site's public endpoints (markdown handler, RSS feed, sitemap, contact endpoint) with `service-desc`, `service-doc`, and `describedby` link relations.",
      "",
      "## Reference",
      "",
      "- https://www.rfc-editor.org/rfc/rfc9727",
      "- https://www.rfc-editor.org/rfc/rfc9264",
      "",
    ].join("\n"),
  },
  {
    name: "oauth-discovery",
    type: "auth",
    description:
      "Publishes RFC 8414 OAuth Authorization Server Metadata declaring no flows are supported (read-only site).",
    body: [
      "# Skill: oauth-discovery",
      "",
      "Implementation: `/.well-known/oauth-authorization-server` is published per RFC 8414. The site is read-only and offers no OAuth flows; `response_types_supported` and `grant_types_supported` are empty arrays. The metadata exists so agents can verify there is no authentication surface to engage with.",
      "",
      "## Reference",
      "",
      "- https://www.rfc-editor.org/rfc/rfc8414",
      "",
    ].join("\n"),
  },
  {
    name: "oauth-protected-resource",
    type: "auth",
    description:
      "Publishes RFC 9728 Protected Resource Metadata declaring no authorization servers (no protected APIs).",
    body: [
      "# Skill: oauth-protected-resource",
      "",
      "Implementation: `/.well-known/oauth-protected-resource` is published per RFC 9728. The site has no protected APIs; `authorization_servers` is empty. The metadata exists so agents can verify there is no protected resource boundary to authenticate against.",
      "",
      "## Reference",
      "",
      "- https://www.rfc-editor.org/rfc/rfc9728",
      "",
    ].join("\n"),
  },
  {
    name: "mcp-server-card",
    type: "discovery",
    description:
      "Publishes an MCP Server Card (SEP-1649) at /.well-known/mcp/server-card.json pointing at the WebMCP tools.",
    body: [
      "# Skill: mcp-server-card",
      "",
      "Implementation: `/.well-known/mcp/server-card.json` is published per the SEP-1649 draft. The card declares `serverInfo`, `transport: { type: \"webmcp\", endpoint: \"https://magnusmagi.com\" }`, and the tool/resource/prompt capability flags. The actual tool surface is delivered via WebMCP in the browser; there is no remote JSON-RPC transport.",
      "",
      "## Reference",
      "",
      "- https://github.com/modelcontextprotocol/modelcontextprotocol/pull/2127",
      "",
    ].join("\n"),
  },
  {
    name: "webmcp",
    type: "agent-tools",
    description:
      "Registers WebMCP tools (listWriting, searchWriting, getWritingPost, getProfile, openContact) via navigator.modelContext.provideContext on every page.",
    body: [
      "# Skill: webmcp",
      "",
      "Implementation: every page on this site registers WebMCP tools by calling `navigator.modelContext.provideContext({ tools })` from a client component (`<WebMcpProvider />`) mounted in the root layout.",
      "",
      "## Tools",
      "",
      "- `listWriting` — list every writing post for the current locale.",
      "- `getWritingPost(slug)` — fetch the markdown body of a single post.",
      "- `searchWriting(query)` — case-insensitive substring search over post titles, descriptions, and tags.",
      "- `getProfile` — return the site owner's public profile in markdown.",
      "- `openContact` — scroll the contact section into view.",
      "",
      "All tools fetch from the markdown content negotiation surface (`Accept: text/markdown`) so output stays consistent with the rest of the site's agent surface.",
      "",
      "## Reference",
      "",
      "- https://webmachinelearning.github.io/webmcp/",
      "- https://developer.chrome.com/blog/webmcp-epp",
      "",
    ].join("\n"),
  },
  {
    name: "markdown-negotiation",
    type: "content-accessibility",
    description:
      "Site honors Accept: text/markdown via content negotiation and returns Content-Type: text/markdown with x-markdown-tokens metadata.",
    body: [
      "# Skill: markdown-negotiation",
      "",
      "Implementation: this site responds to `Accept: text/markdown` requests with a markdown representation of the same resource that browsers receive as HTML.",
      "",
      "## Behavior",
      "",
      "- Trigger: a request includes `text/markdown` in the `Accept` header with quality value greater than or equal to `text/html`.",
      "- Response `Content-Type`: `text/markdown; charset=utf-8`.",
      "- Response includes `Vary: Accept` so caches do not collapse the two representations.",
      "- Response includes `x-markdown-tokens` (estimated token count, character-length / 4 heuristic).",
      "- Response includes `Content-Signal: ai-train=yes, search=yes, ai-input=yes`.",
      "- Default representation remains HTML when `Accept` does not prefer markdown.",
      "",
      "## Coverage",
      "",
      "- `/` and `/{locale}` (homepage)",
      "- `/{locale?}/writing` (post index)",
      "- `/{locale?}/writing/{slug}` (single post — emits raw MDX content)",
      "- `/{locale?}/writing/tag/{tag}` (tag list)",
      "",
      "Unsupported routes return a 404 markdown body when negotiation is requested.",
      "",
      "## Reference",
      "",
      "- https://isitagentready.com/.well-known/agent-skills/markdown-negotiation/SKILL.md",
      "- https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/",
      "",
    ].join("\n"),
  },
  {
    name: "content-signals",
    type: "ai-preferences",
    description:
      "Robots.txt declares Content-Signal preferences (ai-train, search, ai-input) per the IETF aipref draft.",
    body: [
      "# Skill: content-signals",
      "",
      "Implementation: `/robots.txt` carries a `Content-Signal` directive declaring AI usage preferences for the site.",
      "",
      "## Declared preference",
      "",
      "```",
      "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
      "```",
      "",
      "These preferences also accompany markdown responses on the wire as a `Content-Signal` response header.",
      "",
      "## Reference",
      "",
      "- https://isitagentready.com/.well-known/agent-skills/content-signals/SKILL.md",
      "- https://contentsignals.org/",
      "- https://datatracker.ietf.org/doc/draft-romm-aipref-contentsignals/",
      "",
    ].join("\n"),
  },
];

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

const skillIndex = new Map(skillSources.map((s) => [s.name, s]));

export function getSkillBody(name: string): string | null {
  return skillIndex.get(name)?.body ?? null;
}

export function getSkillManifest(): AgentSkill[] {
  return skillSources.map((s) => ({
    name: s.name,
    type: s.type,
    description: s.description,
    url: `${BASE_URL}/.well-known/agent-skills/${s.name}/SKILL.md`,
    sha256: sha256Hex(s.body),
  }));
}

export const AGENT_SKILLS_SCHEMA =
  "https://github.com/cloudflare/agent-skills-discovery-rfc/blob/main/v0.2.0.json";

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

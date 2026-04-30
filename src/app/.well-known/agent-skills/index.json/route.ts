import { AGENT_SKILLS_SCHEMA, getSkillManifest } from "@/lib/agent-skills";

export function GET(): Response {
  const body = JSON.stringify(
    {
      $schema: AGENT_SKILLS_SCHEMA,
      version: "0.2.0",
      skills: getSkillManifest(),
    },
    null,
    2,
  );

  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

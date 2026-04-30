import { getSkillBody } from "@/lib/agent-skills";

export function GET(): Response {
  const body = getSkillBody("markdown-negotiation");
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

import { type NextRequest } from "next/server";

import { estimateTokens } from "@/lib/accept";
import { renderRouteMarkdown } from "@/lib/markdown-render";

export const dynamic = "force-dynamic";

const MARKDOWN_CONTENT_TYPE = "text/markdown; charset=utf-8";

function markdownResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": MARKDOWN_CONTENT_TYPE,
      "Content-Signal": "ai-train=yes, search=yes, ai-input=yes",
      Vary: "Accept",
      "x-markdown-tokens": estimateTokens(body).toString(),
      "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400",
    },
  });
}

export async function GET(request: NextRequest): Promise<Response> {
  const path =
    request.headers.get("x-markdown-path") ??
    request.nextUrl.searchParams.get("path") ??
    "/";

  try {
    const markdown = await renderRouteMarkdown(path);
    if (markdown === null) {
      return markdownResponse(
        `# Not found\n\nNo markdown representation is available for \`${path}\`.\n`,
        404,
      );
    }
    return markdownResponse(markdown);
  } catch {
    return markdownResponse(
      `# Error\n\nFailed to render markdown for \`${path}\`.\n`,
      500,
    );
  }
}

export async function HEAD(request: NextRequest): Promise<Response> {
  const response = await GET(request);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}

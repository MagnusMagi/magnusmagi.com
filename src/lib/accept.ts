interface MediaTypePref {
  type: string;
  q: number;
}

function parseAcceptHeader(header: string): MediaTypePref[] {
  return header
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [rawType, ...params] = entry.split(";").map((s) => s.trim());
      let q = 1;
      for (const param of params) {
        const [key, value] = param.split("=").map((s) => s.trim());
        if (key === "q" && value !== undefined) {
          const parsed = Number.parseFloat(value);
          if (!Number.isNaN(parsed)) q = parsed;
        }
      }
      return { type: rawType.toLowerCase(), q };
    });
}

export function prefersMarkdown(acceptHeader: string | null): boolean {
  if (!acceptHeader) return false;
  const prefs = parseAcceptHeader(acceptHeader);

  let markdownQ = -1;
  let htmlQ = -1;

  for (const { type, q } of prefs) {
    if (q <= 0) continue;
    if (type === "text/markdown" || type === "text/x-markdown") {
      markdownQ = Math.max(markdownQ, q);
    } else if (type === "text/html" || type === "application/xhtml+xml") {
      htmlQ = Math.max(htmlQ, q);
    }
  }

  if (markdownQ <= 0) return false;
  if (htmlQ <= 0) return true;
  return markdownQ >= htmlQ;
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

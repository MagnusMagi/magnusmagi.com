export interface TocEntry {
  depth: 2 | 3;
  text: string;
  slug: string;
}

const HEADING_RE = /^(#{2,3})\s+(.+?)\s*$/gm;
const FENCE_RE = /^```/gm;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function maskCodeFences(source: string): string {
  let inFence = false;
  return source
    .split("\n")
    .map((line) => {
      if (FENCE_RE.test(line)) {
        FENCE_RE.lastIndex = 0;
        inFence = !inFence;
        return "";
      }
      return inFence ? "" : line;
    })
    .join("\n");
}

export function extractToc(source: string): TocEntry[] {
  const cleaned = maskCodeFences(source);
  const out: TocEntry[] = [];
  const seen = new Map<string, number>();

  for (const match of cleaned.matchAll(HEADING_RE)) {
    const depth = match[1].length === 2 ? 2 : 3;
    const text = match[2]
      .replace(/\[(.+?)\]\(.+?\)/g, "$1")
      .replace(/[*_`]/g, "")
      .trim();
    if (!text) continue;
    const baseSlug = slugify(text);
    const count = seen.get(baseSlug) ?? 0;
    seen.set(baseSlug, count + 1);
    const slug = count === 0 ? baseSlug : `${baseSlug}-${count}`;
    out.push({ depth: depth as 2 | 3, text, slug });
  }
  return out;
}

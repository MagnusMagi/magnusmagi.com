import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";

import matter from "gray-matter";
import { z } from "zod";

const CONTENT_ROOT = path.join(process.cwd(), "content", "writing");

const PostFrontmatter = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "publishedAt must be YYYY-MM-DD"),
    updatedAt: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "updatedAt must be YYYY-MM-DD")
      .optional(),
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    translations: z.record(z.string(), z.string()).optional().default({}),
    originalLocale: z
      .preprocess(
        (value) => (value === "" ? undefined : value),
        z.enum(["en", "et"]).optional(),
      )
      .optional(),
    section: z.string().optional(),
  })
  .refine((data) => !data.coverImage || (data.coverAlt && data.coverAlt.length > 0), {
    message: "coverAlt is required when coverImage is set",
    path: ["coverAlt"],
  })
  .refine(
    (data) =>
      !data.updatedAt ||
      Date.parse(data.updatedAt) >= Date.parse(data.publishedAt),
    {
      message: "updatedAt cannot be earlier than publishedAt",
      path: ["updatedAt"],
    },
  );

export type PostFrontmatterT = z.infer<typeof PostFrontmatter>;

export interface Post {
  slug: string;
  locale: string;
  frontmatter: PostFrontmatterT;
  content: string;
  readingMinutes: number;
  wordCount: number;
}

const WORDS_PER_MINUTE_PROSE = 220;
const WORDS_PER_MINUTE_CODE = 80;

function partitionContent(text: string): { prose: string; code: string } {
  let inFence = false;
  const proseLines: string[] = [];
  const codeLines: string[] = [];
  for (const line of text.split("\n")) {
    if (/^```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      codeLines.push(line);
    } else {
      proseLines.push(
        line.replace(/`[^`]*`/g, " ").replace(/[*_~]/g, " "),
      );
    }
  }
  return { prose: proseLines.join("\n"), code: codeLines.join("\n") };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function computeReadingStats(text: string): { wordCount: number; readingMinutes: number } {
  const { prose, code } = partitionContent(text);
  const proseWords = countWords(prose);
  const codeWords = countWords(code);
  const wordCount = proseWords + codeWords;
  const minutes =
    proseWords / WORDS_PER_MINUTE_PROSE + codeWords / WORDS_PER_MINUTE_CODE;
  return { wordCount, readingMinutes: Math.max(1, Math.round(minutes)) };
}

async function readPost(locale: string, file: string): Promise<Post | null> {
  if (!file.endsWith(".mdx") && !file.endsWith(".md")) return null;
  const slug = file.replace(/\.(mdx|md)$/, "");
  const fullPath = path.join(CONTENT_ROOT, locale, file);
  const raw = await fs.readFile(fullPath, "utf-8");
  const { data, content } = matter(raw);
  const parsed = PostFrontmatter.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid frontmatter in ${locale}/${file}: ${parsed.error.message}`,
    );
  }
  const stats = computeReadingStats(content);
  return {
    slug,
    locale,
    frontmatter: parsed.data,
    content,
    readingMinutes: stats.readingMinutes,
    wordCount: stats.wordCount,
  };
}

async function listLocaleFiles(locale: string): Promise<string[]> {
  try {
    return await fs.readdir(path.join(CONTENT_ROOT, locale));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

export const getAllPosts = cache(async (locale: string): Promise<Post[]> => {
  const files = await listLocaleFiles(locale);
  const posts = await Promise.all(files.map((file) => readPost(locale, file)));

  return posts
    .filter((post): post is Post => post !== null)
    .filter((post) =>
      process.env.NODE_ENV === "production" ? !post.frontmatter.draft : true,
    )
    .sort(
      (a, b) =>
        Date.parse(b.frontmatter.publishedAt) -
        Date.parse(a.frontmatter.publishedAt),
    );
});

export const getPostBySlug = cache(
  async (locale: string, slug: string): Promise<Post | null> => {
    const candidates = [`${slug}.mdx`, `${slug}.md`];
    for (const file of candidates) {
      try {
        return await readPost(locale, file);
      } catch (error) {
        if (
          error instanceof Error &&
          "code" in error &&
          (error as NodeJS.ErrnoException).code === "ENOENT"
        ) {
          continue;
        }
        throw error;
      }
    }
    return null;
  },
);

export async function getAllSlugs(
  locale: string,
): Promise<Array<{ slug: string }>> {
  const posts = await getAllPosts(locale);
  return posts.map((post) => ({ slug: post.slug }));
}

export interface TagWithCount {
  tag: string;
  count: number;
}

export const getAllTags = cache(
  async (locale: string): Promise<TagWithCount[]> => {
    const posts = await getAllPosts(locale);
    const counts = new Map<string, number>();
    for (const post of posts) {
      for (const tag of post.frontmatter.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  },
);

export const getRelatedPosts = cache(
  async (locale: string, slug: string, limit = 3): Promise<Post[]> => {
    const posts = await getAllPosts(locale);
    const current = posts.find((p) => p.slug === slug);
    if (!current) return [];
    const currentTags = new Set(
      current.frontmatter.tags.map((t) => t.toLowerCase()),
    );
    if (currentTags.size === 0) return [];

    const scored = posts
      .filter((p) => p.slug !== slug)
      .map((p) => {
        const overlap = p.frontmatter.tags.filter((t) =>
          currentTags.has(t.toLowerCase()),
        ).length;
        return { post: p, overlap };
      })
      .filter((entry) => entry.overlap > 0)
      .sort((a, b) => {
        if (b.overlap !== a.overlap) return b.overlap - a.overlap;
        return (
          Date.parse(b.post.frontmatter.publishedAt) -
          Date.parse(a.post.frontmatter.publishedAt)
        );
      });

    return scored.slice(0, limit).map((entry) => entry.post);
  },
);

export const getPostsByTag = cache(
  async (locale: string, tag: string): Promise<Post[]> => {
    const posts = await getAllPosts(locale);
    const needle = tag.toLowerCase();
    return posts.filter((post) =>
      post.frontmatter.tags.some((t) => t.toLowerCase() === needle),
    );
  },
);

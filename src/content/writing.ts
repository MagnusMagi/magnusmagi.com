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
    tags: z.array(z.string()).optional().default([]),
    draft: z.boolean().optional().default(false),
    coverImage: z.string().optional(),
    coverAlt: z.string().optional(),
    translations: z.record(z.string(), z.string()).optional().default({}),
  })
  .refine((data) => !data.coverImage || (data.coverAlt && data.coverAlt.length > 0), {
    message: "coverAlt is required when coverImage is set",
    path: ["coverAlt"],
  });

export type PostFrontmatterT = z.infer<typeof PostFrontmatter>;

export interface Post {
  slug: string;
  locale: string;
  frontmatter: PostFrontmatterT;
  content: string;
  readingMinutes: number;
}

const WORDS_PER_MINUTE = 200;

function computeReadingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
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
  return {
    slug,
    locale,
    frontmatter: parsed.data,
    content,
    readingMinutes: computeReadingMinutes(content),
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

export const getPostsByTag = cache(
  async (locale: string, tag: string): Promise<Post[]> => {
    const posts = await getAllPosts(locale);
    const needle = tag.toLowerCase();
    return posts.filter((post) =>
      post.frontmatter.tags.some((t) => t.toLowerCase() === needle),
    );
  },
);

"use client";

import { useEffect } from "react";

interface WebMcpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (args: Record<string, unknown>) => Promise<string> | string;
}

interface WebMcpContext {
  provideContext: (input: { tools: WebMcpTool[] }) => void;
}

declare global {
  interface Navigator {
    modelContext?: WebMcpContext;
  }
}

interface WebMcpProviderProps {
  locale: "en" | "et";
}

async function fetchMarkdown(path: string): Promise<string> {
  const response = await fetch(path, {
    headers: { Accept: "text/markdown" },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.text();
}

function localePrefix(locale: "en" | "et"): string {
  return locale === "en" ? "" : `/${locale}`;
}

export function WebMcpProvider({ locale }: WebMcpProviderProps) {
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ctx = navigator.modelContext;
    if (!ctx?.provideContext) return;

    const prefix = localePrefix(locale);

    const tools: WebMcpTool[] = [
      {
        name: "listWriting",
        description:
          "List every writing post available on magnusmagi.com (titles, dates, descriptions, tags) for the current locale.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => fetchMarkdown(`${prefix}/writing`),
      },
      {
        name: "getWritingPost",
        description:
          "Fetch the full markdown body of a single writing post by slug (e.g. 'the-quiet-stack').",
        inputSchema: {
          type: "object",
          properties: {
            slug: {
              type: "string",
              description: "The post slug, taken from /writing/<slug> URLs.",
            },
          },
          required: ["slug"],
          additionalProperties: false,
        },
        execute: async (args) => {
          const slug = String(args.slug ?? "").trim();
          if (!slug) return "Error: slug is required.";
          return fetchMarkdown(`${prefix}/writing/${encodeURIComponent(slug)}`);
        },
      },
      {
        name: "searchWriting",
        description:
          "Search writing posts by case-insensitive substring across title, description, and tags. Returns matching posts in markdown.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search term." },
          },
          required: ["query"],
          additionalProperties: false,
        },
        execute: async (args) => {
          const query = String(args.query ?? "")
            .trim()
            .toLowerCase();
          if (!query) return "Error: query is required.";
          const index = await fetchMarkdown(`${prefix}/writing`);
          const blocks = index.split(/\n## /).slice(1);
          const matches = blocks
            .filter((block) => block.toLowerCase().includes(query))
            .map((block) => `## ${block.trim()}`);
          if (matches.length === 0) return `No posts matched "${query}".`;
          return matches.join("\n\n");
        },
      },
      {
        name: "getProfile",
        description:
          "Return the site owner's public profile (name, role, current focus, location, contact email) as markdown.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: async () => fetchMarkdown(`${prefix}/`),
      },
      {
        name: "openContact",
        description:
          "Scroll the contact section into view in the current page. Returns a confirmation string.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: false,
        },
        execute: () => {
          if (typeof document === "undefined") return "Document is not available.";
          const target =
            document.getElementById("contact") ?? document.querySelector("[data-section='contact']");
          if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            return "Contact section scrolled into view.";
          }
          return "Contact section not found on this page.";
        },
      },
    ];

    try {
      ctx.provideContext({ tools });
    } catch {
      // Ignore — agent context registration is best-effort.
    }
  }, [locale]);

  return null;
}

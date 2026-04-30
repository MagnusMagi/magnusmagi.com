import { readFile } from "node:fs/promises";
import path from "node:path";

import { ImageResponse } from "next/og";

import { getPostBySlug } from "@/content/writing";
import type { Locale } from "@/i18n/routing";

export const runtime = "nodejs";
export const alt = "Magnus Mägi — Writing";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

async function loadGeistMono(weight: "Regular" | "SemiBold"): Promise<ArrayBuffer> {
  const filePath = path.join(
    process.cwd(),
    "node_modules",
    "geist",
    "dist",
    "fonts",
    "geist-mono",
    `GeistMono-${weight}.ttf`,
  );
  const buf = await readFile(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

interface OgProps {
  params: Promise<{ locale: string; slug: string }>;
}

function formatDate(iso: string, locale: Locale): string {
  const tag = locale === "et" ? "et-EE" : "en-US";
  return new Date(iso).toLocaleDateString(tag, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostOpengraphImage({ params }: OgProps) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(locale, slug);
  const title = post?.frontmatter.title ?? "Writing";
  const description = post?.frontmatter.description ?? "";
  const publishedAt = post?.frontmatter.publishedAt;
  const tags = post?.frontmatter.tags ?? [];

  const [regular, semibold] = await Promise.all([
    loadGeistMono("Regular"),
    loadGeistMono("SemiBold"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "#0b0b0a",
          color: "#f4f1ea",
          fontFamily: "Geist Mono",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 22,
            color: "#9a948a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <span>Writing</span>
          {publishedAt ? (
            <>
              <span>·</span>
              <span>{formatDate(publishedAt, locale as Locale)}</span>
            </>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: title.length > 50 ? 80 : title.length > 30 ? 100 : 120,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            {title}
          </div>
          {description ? (
            <div
              style={{
                fontSize: 30,
                color: "#9a948a",
                maxWidth: 1040,
                lineHeight: 1.3,
              }}
            >
              {description.length > 180
                ? `${description.slice(0, 177)}…`
                : description}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#9a948a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            borderTop: "1px solid #232220",
            paddingTop: 24,
          }}
        >
          <span>magnus.mägi</span>
          <span style={{ display: "flex", gap: 12 }}>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist Mono", data: regular, style: "normal", weight: 400 },
        { name: "Geist Mono", data: semibold, style: "normal", weight: 600 },
      ],
    },
  );
}

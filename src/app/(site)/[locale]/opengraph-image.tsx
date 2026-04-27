import { ImageResponse } from "next/og";

import { getHero } from "@/content/site";
import type { Locale } from "@/i18n/routing";

export const runtime = "nodejs";
export const alt = "Magnus Mägi";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

interface OgProps {
  params: Promise<{ locale: string }>;
}

export default async function OpengraphImage({ params }: OgProps) {
  const { locale } = await params;
  const hero = await getHero(locale as Locale);

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
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#9a948a",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              background: "#22c55e",
            }}
          />
          {hero.available}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 130,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            {hero.name}
          </div>
          <div
            style={{
              fontSize: 36,
              color: "#9a948a",
              maxWidth: 900,
              lineHeight: 1.2,
            }}
          >
            {hero.tagline}
          </div>
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
          <span>magnusmagi.com</span>
          <span>{hero.metaLocationValue} · {hero.metaLocationCoords}</span>
        </div>
      </div>
    ),
    { ...size },
  );
}

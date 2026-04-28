import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 } as const;
export const contentType = "image/png";

export default async function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 36,
            right: 44,
            width: 22,
            height: 22,
            borderRadius: 9999,
            background: "#f97316",
          }}
        />
        <svg
          width="140"
          height="140"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: "block" }}
        >
          <path d="M4 25 L11 11 L16 18 L21 11 L28 25 Z" fill="#fafaf7" />
        </svg>
      </div>
    ),
    { ...size },
  );
}

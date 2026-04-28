import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Magnus Mägi",
    short_name: "magnusmagi",
    description:
      "Independent founder and engineer shipping consumer software end-to-end.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#0d0d0d",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}

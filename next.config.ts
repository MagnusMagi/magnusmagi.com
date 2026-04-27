import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingIncludes: {
    "/[locale]/writing/**": ["./content/**/*"],
    "/feed.xml": ["./content/**/*"],
    "/sitemap.xml": ["./content/**/*"],
  },
};

export default withNextIntl(nextConfig);

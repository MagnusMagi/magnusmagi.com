import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SkipLink } from "@/components/SkipLink";
import { getMeta } from "@/content/site";
import { routing, type Locale } from "@/i18n/routing";
import "../../globals.css";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0b0a" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = await getMeta(locale as Locale);

  return {
    metadataBase: new URL("https://magnusmagi.com"),
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        et: "/et",
      },
    },
    openGraph: {
      type: "website",
      title: meta.title,
      description: meta.description,
      siteName: "Magnus Mägi",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    icons: {
      other: [
        {
          rel: "alternate",
          type: "application/rss+xml",
          url: "/feed.xml",
        },
      ],
    },
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <NextIntlClientProvider>
          <SkipLink />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

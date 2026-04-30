import { getLocale, getTranslations } from "next-intl/server";

import type { SiteContent } from "@/content/site";
import { Link } from "@/i18n/navigation";

const SOURCE_URL = "https://github.com/MagnusMagi/magnusmagi.com";

interface FooterProps {
  data: SiteContent["footer"];
}

export async function Footer({ data }: FooterProps) {
  const year = new Date().getFullYear();
  const [tNav, locale] = await Promise.all([
    getTranslations("Nav"),
    getLocale(),
  ]);
  const feedHref = locale === "et" ? "/et/feed.xml" : "/feed.xml";

  return (
    <footer className="py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 text-xs text-muted sm:flex-row sm:items-center">
        <span className="font-mono uppercase tracking-[0.18em]">
          {data.tagline}
        </span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href="/writing"
            className="font-mono uppercase tracking-[0.18em] underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            {tNav("writing")}
          </Link>
          <a
            href={feedHref}
            className="font-mono uppercase tracking-[0.18em] underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            RSS
          </a>
          <Link
            href="/design-systems"
            className="font-mono uppercase tracking-[0.18em] underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            {data.designSystems}
          </Link>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono uppercase tracking-[0.18em] underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            {data.viewSource} ↗
          </a>
          <span>
            © <span suppressHydrationWarning>{year}</span> Magnus Mägi
          </span>
        </div>
      </div>
    </footer>
  );
}

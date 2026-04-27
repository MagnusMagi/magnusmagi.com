import type { SiteContent } from "@/content/site";

const SOURCE_URL = "https://github.com/MagnusMagi/magnusmagi.com";

interface FooterProps {
  data: SiteContent["footer"];
}

export function Footer({ data }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-3 px-6 text-xs text-muted sm:flex-row sm:items-center">
        <span className="font-mono uppercase tracking-[0.18em]">
          {data.tagline}
        </span>
        <div className="flex items-center gap-4">
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono uppercase tracking-[0.18em] underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            {data.viewSource} ↗
          </a>
          <span>© {year} Magnus Mägi</span>
        </div>
      </div>
    </footer>
  );
}

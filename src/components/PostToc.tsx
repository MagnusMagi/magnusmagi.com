import { getTranslations } from "next-intl/server";

import type { Locale } from "@/i18n/routing";
import type { TocEntry } from "@/lib/toc";

interface PostTocProps {
  entries: TocEntry[];
  locale: Locale;
}

export async function PostToc({ entries, locale }: PostTocProps) {
  if (entries.length < 2) return null;

  const t = await getTranslations({ locale, namespace: "Writing" });

  return (
    <details className="mt-10 rounded-2xl border border-border bg-subtle/30 px-5 py-4 text-sm">
      <summary className="cursor-pointer select-none font-mono text-xs uppercase tracking-[0.18em] text-muted hover:text-foreground">
        {t("toc")}
      </summary>
      <ol className="mt-4 flex flex-col gap-2">
        {entries.map((entry) => (
          <li
            key={entry.slug}
            className={entry.depth === 3 ? "pl-4" : ""}
          >
            <a
              href={`#${entry.slug}`}
              className="text-muted underline-offset-4 transition-colors hover:text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </details>
  );
}

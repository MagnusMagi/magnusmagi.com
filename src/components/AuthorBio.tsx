import { getTranslations } from "next-intl/server";

import { getHero } from "@/content/site";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

interface AuthorBioProps {
  locale: Locale;
}

export async function AuthorBio({ locale }: AuthorBioProps) {
  const [hero, t] = await Promise.all([
    getHero(locale),
    getTranslations({ locale, namespace: "Writing" }),
  ]);

  return (
    <aside
      aria-label={t("aboutAuthor")}
      className="mt-12 rounded-2xl border border-border bg-subtle/30 p-6"
    >
      <span className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
        {t("aboutAuthor")}
      </span>
      <h2 className="mt-2 text-base font-semibold tracking-tight">
        {hero.name}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {hero.intro}
      </p>
      <div className="mt-4 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.18em]">
        <Link
          href="/"
          className="text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
        >
          {t("aboutMore")} →
        </Link>
        <Link
          href="/writing"
          className="text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
        >
          {t("backToList")} →
        </Link>
      </div>
    </aside>
  );
}

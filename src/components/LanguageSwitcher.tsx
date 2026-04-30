"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { routing, type Locale } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";
import { usePostTranslation } from "./PostTranslationProvider";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("LanguageSwitcher");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const postTranslation = usePostTranslation();
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: Locale) => {
    if (next === locale) return;
    startTransition(() => {
      if (postTranslation) {
        const targetSlug = postTranslation.slugs[next];
        if (targetSlug) {
          const prefix = next === routing.defaultLocale ? "" : `/${next}`;
          router.push(`${prefix}${postTranslation.basePath}/${targetSlug}`);
          return;
        }
        const indexPrefix = next === routing.defaultLocale ? "" : `/${next}`;
        router.push(`${indexPrefix}${postTranslation.basePath}`);
        return;
      }
      router.replace(
        // @ts-expect-error -- pathname is a generic string here
        { pathname, params },
        { locale: next },
      );
    });
  };

  const isMissingTranslation = (value: Locale): boolean => {
    if (!postTranslation || value === locale) return false;
    return !postTranslation.slugs[value];
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="inline-flex items-center gap-1 rounded-full border border-border bg-subtle/40 p-1 text-xs font-medium"
    >
      {routing.locales.map((value) => {
        const active = value === locale;
        const fallback = isMissingTranslation(value);
        const ariaLabel = fallback ? t("missingTranslation", { locale: value }) : t(value);
        return (
          <button
            key={value}
            type="button"
            onClick={() => handleChange(value)}
            disabled={isPending}
            aria-pressed={active}
            aria-label={ariaLabel}
            title={ariaLabel}
            className={`min-h-9 min-w-9 rounded-full px-3 py-1.5 uppercase tracking-wider transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
              active
                ? "bg-foreground text-background"
                : fallback
                  ? "text-muted/60 hover:text-foreground"
                  : "text-muted hover:text-foreground"
            }`}
          >
            {value}
          </button>
        );
      })}
    </div>
  );
}

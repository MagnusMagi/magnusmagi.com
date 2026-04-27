const LOCALE_TAGS: Record<string, string> = {
  en: "en-US",
  et: "et-EE",
};

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(LOCALE_TAGS[locale] ?? locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

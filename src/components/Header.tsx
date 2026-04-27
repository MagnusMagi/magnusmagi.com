import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

const NAV_ITEMS = [
  { key: "about", href: "/#about" },
  { key: "work", href: "/#work" },
  { key: "writing", href: "/writing" },
  { key: "contact", href: "/#contact" },
] as const;

export function Header() {
  const t = useTranslations("Nav");

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-mono text-sm tracking-tight text-foreground"
        >
          magnus<span className="text-accent">.</span>mägi
        </Link>

        <nav
          aria-label={t("primaryLabel")}
          className="hidden items-center gap-7 text-sm text-muted md:flex"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <LanguageSwitcher />
      </div>
    </header>
  );
}

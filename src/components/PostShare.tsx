"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface PostShareProps {
  url: string;
  title: string;
  emailTo: string;
}

export function PostShare({ url, title, emailTo }: PostShareProps) {
  const t = useTranslations("Writing");
  const [copied, setCopied] = useState(false);

  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(
    `${title} — ${url}`,
  )}`;
  const subject = encodeURIComponent(`Re: ${title}`);
  const emailHref = `mailto:${emailTo}?subject=${subject}`;

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore — clipboard may be denied
    }
  };

  const linkClass =
    "inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-subtle/40 px-4 py-2 text-xs font-medium text-muted transition-colors hover:border-accent/40 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={xHref}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
        aria-label={t("shareOnX")}
      >
        {t("shareOnX")}
      </a>
      <a href={emailHref} className={linkClass} aria-label={t("emailReply")}>
        {t("emailReply")}
      </a>
      <button type="button" onClick={onCopy} className={linkClass}>
        {copied ? t("linkCopied") : t("copyLink")}
      </button>
    </div>
  );
}

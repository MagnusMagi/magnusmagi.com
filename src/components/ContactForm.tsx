"use client";

import { useId, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; reason: "validation" | "rate_limit" | "server" | "config" };

const initialStatus: Status = { kind: "idle" };

export function ContactForm() {
  const t = useTranslations("Contact.form");
  const locale = useLocale();
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const honeypotId = useId();

  const [status, setStatus] = useState<Status>(initialStatus);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      website: String(data.get("website") ?? ""),
      locale,
    };

    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as
        | { success: true }
        | { success: false; error: "validation" | "rate_limit" | "server" | "config" };

      if (body.success) {
        form.reset();
        setStatus({ kind: "success" });
        return;
      }
      setStatus({ kind: "error", reason: body.error });
    } catch {
      setStatus({ kind: "error", reason: "server" });
    }
  }

  if (status.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border/60 bg-subtle/50 p-6"
      >
        <p className="text-base font-medium text-foreground">{t("successTitle")}</p>
        <p className="mt-1 text-sm text-foreground/70">{t("successBody")}</p>
      </div>
    );
  }

  const isSubmitting = status.kind === "submitting";
  const errorMessage = status.kind === "error" ? errorTextFor(t, status.reason) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5" aria-busy={isSubmitting}>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={nameId}
          name="name"
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          required
          maxLength={120}
        />
        <Field
          id={emailId}
          name="email"
          type="email"
          label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          maxLength={254}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={messageId}
          className="font-mono text-xs uppercase tracking-[0.18em] text-muted"
        >
          {t("messageLabel")}
        </label>
        <textarea
          id={messageId}
          name="message"
          required
          minLength={10}
          maxLength={4000}
          rows={5}
          placeholder={t("messagePlaceholder")}
          className="resize-y rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted/70 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor={honeypotId}>{t("honeypotLabel")}</label>
        <input
          id={honeypotId}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("submitting") : t("submit")}
        </button>
        {errorMessage ? (
          <p
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {errorMessage}
          </p>
        ) : null}
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
}

function Field({ id, name, label, placeholder, type = "text", autoComplete, required, maxLength }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-[0.18em] text-muted"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
      />
    </div>
  );
}

function errorTextFor(
  t: ReturnType<typeof useTranslations<"Contact.form">>,
  reason: "validation" | "rate_limit" | "server" | "config",
): string {
  switch (reason) {
    case "validation":
      return t("errorValidation");
    case "rate_limit":
      return t("errorRateLimit");
    case "config":
      return t("errorConfig");
    case "server":
      return t("errorServer");
  }
}

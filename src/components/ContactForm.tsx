"use client";

import { useId, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

type FieldName = "name" | "email" | "message";

type FieldErrors = Partial<Record<FieldName, string>>;

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | {
      kind: "error";
      reason: "validation" | "rate_limit" | "server" | "config" | "forbidden";
    };

const initialStatus: Status = { kind: "idle" };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validatePayload(
  payload: { name: string; email: string; message: string },
  t: ReturnType<typeof useTranslations<"Contact.form">>,
): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedName = payload.name.trim();
  const trimmedEmail = payload.email.trim();
  const trimmedMessage = payload.message.trim();

  if (!trimmedName) {
    errors.name = t("errorNameRequired");
  } else if (trimmedName.length > 120) {
    errors.name = t("errorNameTooLong");
  }

  if (!trimmedEmail) {
    errors.email = t("errorEmailRequired");
  } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
    errors.email = t("errorEmailInvalid");
  }

  if (!trimmedMessage) {
    errors.message = t("errorMessageRequired");
  } else if (trimmedMessage.length < 10) {
    errors.message = t("errorMessageTooShort");
  } else if (trimmedMessage.length > 4000) {
    errors.message = t("errorMessageTooLong");
  }

  return errors;
}

export function ContactForm() {
  const t = useTranslations("Contact.form");
  const locale = useLocale();
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const honeypotId = useId();
  const nameErrId = useId();
  const emailErrId = useId();
  const messageErrId = useId();
  const formErrId = useId();

  const [status, setStatus] = useState<Status>(initialStatus);
  const [errors, setErrors] = useState<FieldErrors>({});

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

    const fieldErrors = validatePayload(payload, t);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      setStatus({ kind: "error", reason: "validation" });
      const firstErrField = Object.keys(fieldErrors)[0] as FieldName;
      const firstId =
        firstErrField === "name"
          ? nameId
          : firstErrField === "email"
            ? emailId
            : messageId;
      const node = document.getElementById(firstId);
      node?.focus();
      return;
    }

    setErrors({});
    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as
        | { success: true }
        | {
            success: false;
            error:
              | "validation"
              | "rate_limit"
              | "server"
              | "config"
              | "forbidden";
          };

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

  function clearFieldError(field: FieldName) {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  if (status.kind === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-border/60 bg-subtle/50 p-6"
      >
        <p className="text-base font-medium text-foreground">
          {t("successTitle")}
        </p>
        <p className="mt-1 text-sm text-foreground/70">{t("successBody")}</p>
      </div>
    );
  }

  const isSubmitting = status.kind === "submitting";
  const formLevelError =
    status.kind === "error" && status.reason !== "validation"
      ? errorTextFor(t, status.reason)
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-5"
      aria-busy={isSubmitting}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          id={nameId}
          name="name"
          label={t("nameLabel")}
          placeholder={t("namePlaceholder")}
          autoComplete="name"
          required
          maxLength={120}
          error={errors.name}
          errorId={nameErrId}
          onInput={() => clearFieldError("name")}
        />
        <Field
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          label={t("emailLabel")}
          placeholder={t("emailPlaceholder")}
          autoComplete="email"
          required
          maxLength={254}
          error={errors.email}
          errorId={emailErrId}
          onInput={() => clearFieldError("email")}
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
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? messageErrId : undefined}
          onInput={() => clearFieldError("message")}
          className={`resize-y rounded-xl border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 ${
            errors.message
              ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
              : "border-border focus:border-foreground focus:ring-foreground/20"
          }`}
        />
        {errors.message ? (
          <p
            id={messageErrId}
            role="alert"
            className="text-xs text-red-600 dark:text-red-400"
          >
            {errors.message}
          </p>
        ) : null}
      </div>

      <div
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
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
          className="inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <svg
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeOpacity="0.3"
                  strokeWidth="3"
                />
                <path
                  d="M21 12a9 9 0 0 0-9-9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <span>{t("submitting")}</span>
            </>
          ) : (
            t("submit")
          )}
        </button>
        {formLevelError ? (
          <p
            id={formErrId}
            role="alert"
            className="text-sm text-red-600 dark:text-red-400"
          >
            {formLevelError}
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
  inputMode?:
    | "text"
    | "email"
    | "tel"
    | "url"
    | "search"
    | "numeric"
    | "decimal"
    | "none";
  autoComplete?: string;
  required?: boolean;
  maxLength?: number;
  error?: string;
  errorId: string;
  onInput?: () => void;
}

function Field({
  id,
  name,
  label,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  required,
  maxLength,
  error,
  errorId,
  onInput,
}: FieldProps) {
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
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        maxLength={maxLength}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onInput={onInput}
        className={`rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:outline-none focus:ring-2 ${
          error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
            : "border-border focus:border-foreground focus:ring-foreground/20"
        }`}
      />
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-xs text-red-600 dark:text-red-400"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

function errorTextFor(
  t: ReturnType<typeof useTranslations<"Contact.form">>,
  reason: "validation" | "rate_limit" | "server" | "config" | "forbidden",
): string {
  switch (reason) {
    case "validation":
      return t("errorValidation");
    case "rate_limit":
      return t("errorRateLimit");
    case "config":
      return t("errorConfig");
    case "forbidden":
      return t("errorServer");
    case "server":
      return t("errorServer");
  }
}

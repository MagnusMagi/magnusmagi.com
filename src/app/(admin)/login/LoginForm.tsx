"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  redirectTo: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const usernameId = useId();
  const passwordId = useId();
  const errorId = useId();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;

    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!username || !password) {
      setStatus({
        kind: "error",
        message: "Username and password are required.",
      });
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const body = (await response.json()) as
        | { success: true }
        | { success: false; error: string };

      if (body.success) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      let message = "Something went wrong. Try again.";
      if (body.error === "credentials") {
        message = "Invalid username or password.";
      } else if (body.error === "rate_limit") {
        message = "Too many attempts. Try again in a few minutes.";
      } else if (body.error === "forbidden") {
        message = "Request blocked. Refresh and try again.";
      }
      setStatus({ kind: "error", message });
    } catch {
      setStatus({ kind: "error", message: "Network error. Try again." });
    }
  }

  const isSubmitting = status.kind === "submitting";
  const errorMessage = status.kind === "error" ? status.message : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label
          htmlFor={usernameId}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          Username
        </label>
        <input
          id={usernameId}
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={passwordId}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          Password
        </label>
        <input
          id={passwordId}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={errorMessage ? true : undefined}
          aria-describedby={errorMessage ? errorId : undefined}
          className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      {errorMessage ? (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-red-600 dark:text-red-400"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

interface LoginFormProps {
  redirectTo: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string };

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #e5e5e0",
  background: "#fff",
  color: "#0d0d0d",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#525252",
  marginBottom: 6,
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.kind === "submitting") return;

    const data = new FormData(event.currentTarget);
    const username = String(data.get("username") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!username || !password) {
      setStatus({ kind: "error", message: "Username and password are required." });
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

      const message =
        body.error === "credentials"
          ? "Invalid username or password."
          : "Something went wrong. Try again.";
      setStatus({ kind: "error", message });
    } catch {
      setStatus({ kind: "error", message: "Network error. Try again." });
    }
  }

  const isSubmitting = status.kind === "submitting";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <label htmlFor="login-username" style={labelStyle}>
          Username
        </label>
        <input
          id="login-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          style={inputStyle}
        />
      </div>
      <div>
        <label htmlFor="login-password" style={labelStyle}>
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          style={inputStyle}
        />
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          padding: "10px 16px",
          borderRadius: 999,
          border: "none",
          background: "#0d0d0d",
          color: "#fafaf7",
          fontSize: 14,
          fontWeight: 500,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: isSubmitting ? 0.6 : 1,
          fontFamily: "inherit",
        }}
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
      {status.kind === "error" ? (
        <p
          role="alert"
          style={{ margin: 0, fontSize: 13, color: "#b91c1c" }}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  );
}

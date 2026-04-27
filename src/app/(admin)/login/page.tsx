import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in · magnus.mägi",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ from?: string }>;
}

const SAFE_REDIRECT = /^\/(?:keystatic|api\/keystatic)(?:\/.*)?$/;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { from } = await searchParams;
  const cookieStore = await cookies();
  const existing = verifySessionToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  const redirectTo = from && SAFE_REDIRECT.test(from) ? from : "/keystatic";

  if (existing) {
    redirect(redirectTo);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#fafaf7",
        color: "#0d0d0d",
        padding: "24px",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          padding: "32px",
          border: "1px solid #e5e5e0",
          borderRadius: 16,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#525252",
              marginBottom: 8,
            }}
          >
            magnus.mägi
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            Admin sign in
          </h1>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}

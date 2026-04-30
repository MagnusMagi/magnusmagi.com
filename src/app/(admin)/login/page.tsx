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
    <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-subtle/40 p-8 shadow-sm">
        <div className="mb-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            magnus.mägi
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Admin sign in
          </h1>
        </div>
        <LoginForm redirectTo={redirectTo} />
      </div>
    </main>
  );
}

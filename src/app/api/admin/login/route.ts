import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  verifyCredentials,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});

type ApiResponse = { success: true } | { success: false; error: "credentials" | "validation" };

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "validation" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "validation" }, { status: 400 });
  }

  if (!verifyCredentials(parsed.data.username, parsed.data.password)) {
    return NextResponse.json({ success: false, error: "credentials" }, { status: 401 });
  }

  const { token, maxAgeSeconds } = createSessionToken(parsed.data.username);
  const response = NextResponse.json<ApiResponse>({ success: true });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  });
  return response;
}

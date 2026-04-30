import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  verifyCredentials,
} from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, isSameOrigin } from "@/lib/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});

const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

type ApiResponse =
  | { success: true }
  | {
      success: false;
      error: "credentials" | "validation" | "rate_limit" | "forbidden";
    };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const ip = clientIp(request);

  const limit = rateLimit(`admin-login:${ip}`, LOGIN_RATE_LIMIT);
  if (!limit.allowed) {
    console.warn(`[admin-login] rate limit hit ip=${ip}`);
    return NextResponse.json(
      { success: false, error: "rate_limit" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil(
            (limit.resetAt - Date.now()) / 1000,
          ).toString(),
        },
      },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "validation" },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "validation" },
      { status: 400 },
    );
  }

  if (!verifyCredentials(parsed.data.username, parsed.data.password)) {
    console.warn(`[admin-login] failed credential check ip=${ip}`);
    return NextResponse.json(
      { success: false, error: "credentials" },
      { status: 401 },
    );
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

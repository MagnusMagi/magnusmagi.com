import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { sendContactEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(["en", "et"]).default("en"),
  website: z.string().max(200).optional(),
});

type ApiResponse =
  | { success: true }
  | { success: false; error: "validation" | "rate_limit" | "server" | "config" };

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "validation" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "validation" }, { status: 400 });
  }

  if (parsed.data.website && parsed.data.website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const limit = rateLimit(`contact:${clientIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "rate_limit" },
      {
        status: 429,
        headers: {
          "Retry-After": Math.ceil((limit.resetAt - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ success: false, error: "config" }, { status: 503 });
  }

  try {
    await sendContactEmail({
      name: parsed.data.name,
      email: parsed.data.email,
      message: parsed.data.message,
      locale: parsed.data.locale,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "server" }, { status: 502 });
  }
}

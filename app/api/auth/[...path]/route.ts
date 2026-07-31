import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const handler = auth.handler();

/** Per-instance sliding window — enough to blunt credential stuffing on a single warm instance. */
const WINDOW_MS = 60_000;
const MAX_POSTS = 30;
const buckets = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || now >= current.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_POSTS;
}

function clientKey(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `auth:${ip}`;
}

export const GET = handler.GET;

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  if (isRateLimited(clientKey(request))) {
    return Response.json(
      { message: "Too many sign-in attempts. Please wait a minute and try again." },
      { status: 429 },
    );
  }
  return handler.POST(request, context);
}

import { NextRequest, NextResponse } from "next/server";

// A small in-memory rate limiter for the endpoints worth protecting:
// login, signup, and OTP sending.
//
// Honest about its limits: the counters live in the process, so on a
// platform that runs several instances (or scales to zero between
// requests) each instance keeps its own tally and a determined attacker
// spread across instances gets proportionally more attempts. It is still
// worth having — it stops the ordinary case of someone hammering one login
// from one machine, and costs nothing to run. If Onile grows to the point
// where credential stuffing is a real threat, move these counters to Redis
// (Upstash has a free tier that works well on serverless) — the call sites
// won't need to change.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(now: number) {
  // Cheap garbage collection so the map can't grow without bound.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

export function rateLimit(
  req: NextRequest,
  action: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const key = `${action}:${clientIp(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfterSeconds: 0 };
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const minutes = Math.max(1, Math.ceil(result.retryAfterSeconds / 60));
  return NextResponse.json(
    { error: `Too many tries. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.` },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}

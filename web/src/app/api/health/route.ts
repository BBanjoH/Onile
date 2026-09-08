import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { findConfigProblems } from "@/lib/env";

// A machine-readable "is the site actually working?" check, for uptime
// monitors (UptimeRobot, BetterStack, a hosting provider's health probe).
// It confirms the database really answers, rather than just that the web
// server is up — a site that renders but can't read the database is down
// as far as a landlord is concerned.
//
// Deliberately says nothing sensitive: config problems are reported by
// count only, never by value.
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {
    checks.database = "unreachable";
    healthy = false;
  }

  const configProblems = findConfigProblems();
  checks.configuration = configProblems.length === 0 ? "ok" : `${configProblems.length} problem(s)`;
  if (configProblems.length > 0) healthy = false;

  return NextResponse.json({ status: healthy ? "ok" : "degraded", checks }, { status: healthy ? 200 : 503 });
}

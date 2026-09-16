import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureUpcomingRentPayment, flagOverduePayments } from "@/lib/rentAutomation";
import { sendRentReminders } from "@/lib/reminders";

// Runs the rent-schedule automation across every active lease: generates
// the next due installment for leases approaching one, and flips anything
// past its grace period to OVERDUE. The dashboard also runs this
// per-landlord on page load, so nothing breaks without this endpoint — but
// wiring it to a scheduler (Vercel Cron, a GitHub Actions cron job, etc.)
// hitting this once a day means reminders/overdue flags update even for
// landlords who haven't opened the app, which is the whole point of
// automating this instead of doing it manually.
//
// Protected by a shared secret (CRON_SECRET) rather than session auth,
// since the caller is a scheduler, not a logged-in user.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    // Vercel Cron sends "Authorization: Bearer <CRON_SECRET>" automatically;
    // the other two forms let any scheduler (GitHub Actions, cron-job.org)
    // call this too.
    const bearer = req.headers.get("authorization")?.replace(/^Bearer /i, "");
    const provided = bearer ?? req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const activeLeases = await prisma.lease.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
  for (const lease of activeLeases) {
    await ensureUpcomingRentPayment(lease.id);
  }
  const overdueCount = await flagOverduePayments();

  // Order matters: flag what's late first, then tell people about it.
  const reminders = await sendRentReminders();

  return NextResponse.json({ leasesChecked: activeLeases.length, newlyOverdue: overdueCount, reminders });
}

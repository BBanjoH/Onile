import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { settlePaymentByTxRef } from "@/lib/rentAutomation";

// Flutterwave signs webhook calls by echoing back the "Secret Hash" you set
// in the dashboard as a `verif-hash` header (a shared secret, not an HMAC
// of the body) — configure the same value here as FLW_SECRET_HASH. This is
// the durable confirmation path: it fires independently of whether the
// tenant's browser ever made it back to /api/payments/callback.
function verifSignatureValid(req: NextRequest): boolean {
  const expected = process.env.FLW_SECRET_HASH;
  const provided = req.headers.get("verif-hash");
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!verifSignatureValid(req)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const event = body?.event as string | undefined;
  const data = body?.data as { id?: number; tx_ref?: string; status?: string } | undefined;

  // Acknowledge anything we don't care about with 200 so Flutterwave
  // doesn't keep retrying it — only act on a completed charge.
  if (event !== "charge.completed" || !data?.tx_ref || !data?.id || data.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  const result = await settlePaymentByTxRef(data.tx_ref, data.id);
  if (!result.ok) {
    // Log for reconciliation, but still 200 — retries won't change a
    // verification mismatch, and Flutterwave expects a fast ack.
    console.error(`[flutterwave webhook] settlement failed for tx_ref=${data.tx_ref}: ${result.reason}`);
  }

  return NextResponse.json({ received: true });
}

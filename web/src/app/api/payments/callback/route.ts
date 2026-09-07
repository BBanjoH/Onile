import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { settlePaymentByTxRef } from "@/lib/rentAutomation";

// Flutterwave redirects the tenant's browser here after hosted checkout,
// with `status`, `tx_ref`, and `transaction_id` as query params. Query
// params are attacker-controllable (a tenant could hand-craft this URL), so
// they're only ever used to look up *which* payment/lease to react to —
// the actual PAID decision happens inside settlePaymentByTxRef, which
// re-verifies the transaction against Flutterwave's API before touching
// the database. The webhook (src/app/api/webhooks/flutterwave/route.ts) is
// the durable confirmation path in case the tenant closes the tab here.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const txRef = searchParams.get("tx_ref");
  const transactionId = searchParams.get("transaction_id");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

  if (!txRef) {
    return NextResponse.redirect(`${appUrl}/my-rentals?payment=error`);
  }

  const payment = await prisma.rentPayment.findFirst({ where: { flwTxRef: txRef }, select: { leaseId: true } });
  const returnTo = payment ? `${appUrl}/dashboard/leases/${payment.leaseId}` : `${appUrl}/my-rentals`;

  if (status === "cancelled" || !transactionId) {
    return NextResponse.redirect(`${returnTo}?payment=cancelled`);
  }

  const result = await settlePaymentByTxRef(txRef, transactionId);
  return NextResponse.redirect(`${returnTo}?payment=${result.ok ? "success" : "failed"}`);
}

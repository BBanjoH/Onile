import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { createPaymentLink, isFlutterwaveConfigured, FlutterwaveApiError } from "@/lib/flutterwave";

// Starts an online rent payment: generates a fresh Flutterwave hosted
// checkout link for this specific installment and stores our reference on
// it, then hands the link back for the browser to redirect to. Only the
// tenant on the lease can pay their own rent this way — a landlord still
// has the manual "Mark Paid" action for cash/offline reconciliation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isFlutterwaveConfigured()) {
    return NextResponse.json(
      { error: "Online payments aren't set up yet. Ask your landlord for bank transfer details instead." },
      { status: 501 },
    );
  }

  const payment = await prisma.rentPayment.findUnique({
    where: { id },
    include: { lease: { include: { property: { select: { title: true } } } } },
  });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.lease.tenantId !== user.id) {
    return NextResponse.json({ error: "You can only pay your own rent" }, { status: 403 });
  }
  if (payment.status === "PAID") {
    return NextResponse.json({ error: "This payment has already been settled" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
  const txRef = `onile-rent-${payment.id}-${Date.now()}`;

  let link: string;
  try {
    ({ link } = await createPaymentLink({
      txRef,
      amount: payment.amount,
      redirectUrl: `${appUrl}/api/payments/callback`,
      customer: { email: user.email, phone: user.phone, name: user.name },
      title: "Onile Rent Payment",
      description: `Rent for ${payment.lease.property.title}`,
      meta: { paymentId: payment.id, leaseId: payment.leaseId },
    }));
  } catch (err) {
    const message = err instanceof FlutterwaveApiError ? err.message : "Unknown error";
    console.error(`[flutterwave] failed to create payment link for payment=${id}: ${message}`);
    return NextResponse.json({ error: "Could not start the payment. Please try again shortly." }, { status: 502 });
  }

  await prisma.rentPayment.update({ where: { id }, data: { flwTxRef: txRef } });

  return NextResponse.json({ link });
}

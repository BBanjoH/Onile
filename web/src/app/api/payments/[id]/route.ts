import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updatePaymentSchema } from "@/lib/validation";

// Marks a scheduled/overdue rent installment as settled (or edits its
// method/note). The status flips to PAID as soon as a paidAt is present.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payment = await prisma.rentPayment.findUnique({ where: { id }, include: { lease: true } });
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.lease.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the landlord can update this payment" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updatePaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { paidAt, ...rest } = parsed.data;
  const updated = await prisma.rentPayment.update({
    where: { id },
    data: {
      ...rest,
      ...(paidAt !== undefined ? { paidAt, status: paidAt ? "PAID" : "PENDING" } : {}),
    },
  });

  return NextResponse.json({ payment: updated });
}

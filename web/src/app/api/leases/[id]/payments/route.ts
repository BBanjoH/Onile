import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { recordPaymentSchema } from "@/lib/validation";

// Lets a landlord log an ad-hoc payment on a lease (e.g. a lump sum that
// doesn't match the auto-generated schedule row exactly). Marking an
// existing scheduled installment as paid is done via PATCH /api/payments/[id]
// instead — this route is for adding to the ledger, not settling it.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  if (lease.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the landlord can record payments on this lease" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = recordPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const { paidAt, ...data } = parsed.data;

  const payment = await prisma.rentPayment.create({
    data: { ...data, leaseId: id, paidAt: paidAt ?? new Date(), status: "PAID", recordedById: user.id },
  });

  return NextResponse.json({ payment }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { updateLeaseSchema } from "@/lib/validation";
import { ensureUpcomingRentPayment, flagOverduePayments } from "@/lib/rentAutomation";

async function loadLease(id: string) {
  return prisma.lease.findUnique({
    where: { id },
    include: {
      property: { select: { id: true, title: true, area: true, address: true } },
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      landlord: { select: { id: true, name: true, email: true, phone: true } },
      payments: { orderBy: { dueDate: "asc" } },
    },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lease = await loadLease(id);
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  if (![lease.landlordId, lease.tenantId].includes(user.id) && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (lease.status === "ACTIVE") await ensureUpcomingRentPayment(lease.id);
  await flagOverduePayments();

  return NextResponse.json({ lease: (await loadLease(id))! });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lease = await prisma.lease.findUnique({ where: { id } });
  if (!lease) return NextResponse.json({ error: "Lease not found" }, { status: 404 });
  if (lease.landlordId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only the landlord can update this lease" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateLeaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const updated = await prisma.lease.update({ where: { id }, data: parsed.data });

  if (parsed.data.status !== "ACTIVE") {
    const stillActive = await prisma.lease.count({ where: { propertyId: lease.propertyId, status: "ACTIVE" } });
    if (stillActive === 0) {
      await prisma.property.update({ where: { id: lease.propertyId }, data: { status: "AVAILABLE" } });
    }
  }

  return NextResponse.json({ lease: updated });
}
